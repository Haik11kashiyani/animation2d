import bpy
import json
import os
import math
import sys
import random

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STORY_PATH = os.path.join(ROOT_DIR, "public", "story.json")
TIMING_PATH = os.path.join(ROOT_DIR, "public", "timing.json")
OUT_PATH = os.path.join(ROOT_DIR, "out", "video.mp4")

def hex_to_rgb(hex_code):
    hex_code = hex_code.lstrip('#')
    return tuple(int(hex_code[i:i + 2], 16) / 255.0 for i in (0, 2, 4)) + (1.0,)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def setup_render_settings(total_frames, fps=60):
    scene = bpy.context.scene
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        scene.render.engine = 'BLENDER_EEVEE'
        
    try:
        scene.eevee.taa_render_samples = 16
        scene.eevee.taa_samples = 8
        scene.eevee.use_gtao = False 
        scene.eevee.use_bloom = True
        # Eevee shadow settings for sharp anime shadows
        scene.eevee.shadow_cascade_size = '1024'
        scene.eevee.use_shadow_high_bitdepth = True
    except Exception as e:
        pass
    
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.fps = fps
    scene.frame_start = 1
    scene.frame_end = total_frames
    
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.audio_codec = 'AAC'
    scene.render.filepath = OUT_PATH

def create_orthographic_camera():
    cam_data = bpy.data.cameras.new("MainCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 12.0
    cam_obj = bpy.data.objects.new("MainCamera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (0, -15, 2)
    cam_obj.rotation_euler = (math.radians(80), 0, 0)
    return cam_obj

def setup_lighting():
    # Crisp Sun Light for Toon Shading
    light_data = bpy.data.lights.new(name="ToonSun", type='SUN')
    light_data.energy = 3.0
    light_data.angle = math.radians(1.0) # Sharp shadows
    light_obj = bpy.data.objects.new("ToonSun", light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(45), math.radians(30), math.radians(20))

# --- PROCEDURAL GHIBLI-STYLE TOON SHADING ENGINE ---

def create_toon_material(name, color_hex):
    mat = bpy.data.materials.new(name=f"{name}_Toon")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    rgb = hex_to_rgb(color_hex)
    
    diffuse = nodes.new('ShaderNodeBsdfDiffuse')
    diffuse.inputs['Color'].default_value = rgb
    
    shader_to_rgb = nodes.new('ShaderNodeShaderToRGB')
    
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.color_ramp.interpolation = 'CONSTANT'
    # Shadow color (darker, slightly saturated)
    color_ramp.color_ramp.elements[0].position = 0.4
    color_ramp.color_ramp.elements[0].color = (rgb[0]*0.5, rgb[1]*0.6, rgb[2]*0.6, 1.0)
    # Highlight color
    color_ramp.color_ramp.elements[1].position = 0.45
    color_ramp.color_ramp.elements[1].color = rgb
    
    output = nodes.new('ShaderNodeOutputMaterial')
    
    links.new(diffuse.outputs['BSDF'], shader_to_rgb.inputs['Shader'])
    links.new(shader_to_rgb.outputs['Color'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], output.inputs['Surface'])
    
    return mat

def create_gradient_sky_material(name, color1_hex, color2_hex):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    tex_coord = nodes.new('ShaderNodeTexCoord')
    mapping = nodes.new('ShaderNodeMapping')
    mapping.inputs['Rotation'].default_value[1] = math.radians(-90)
    
    gradient = nodes.new('ShaderNodeTexGradient')
    gradient.gradient_type = 'LINEAR'
    
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.color_ramp.elements[0].position = 0.2
    color_ramp.color_ramp.elements[0].color = hex_to_rgb(color1_hex)
    color_ramp.color_ramp.elements[1].position = 0.8
    color_ramp.color_ramp.elements[1].color = hex_to_rgb(color2_hex)
    
    emission = nodes.new('ShaderNodeEmission')
    emission.inputs['Strength'].default_value = 1.0
    
    output = nodes.new('ShaderNodeOutputMaterial')
    
    links.new(tex_coord.outputs['Generated'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], gradient.inputs['Vector'])
    links.new(gradient.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], emission.inputs['Color'])
    links.new(emission.outputs['Emission'], output.inputs['Surface'])
    
    return mat

def apply_anime_outline(obj, thickness=0.04):
    mat = bpy.data.materials.new(name="Outline_Mat")
    mat.use_nodes = True
    mat.use_backface_culling = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emission = nodes.new('ShaderNodeEmission')
    # Deep warm brown/black for Studio Ghibli ink outlines
    emission.inputs[0].default_value = (0.05, 0.02, 0.01, 1) 
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emission.outputs[0], out.inputs[0])
    
    obj.data.materials.append(mat)
    
    mod = obj.modifiers.new("LineArt", 'SOLIDIFY')
    mod.thickness = -thickness
    mod.use_flip_normals = True
    mod.material_offset = len(obj.data.materials) - 1

# --- PROCEDURAL 3D TOON GEOMETRY GENERATORS ---

def create_humanoid_character(name, location, scale, color_hex):
    # Head
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=16, radius=0.6, location=(location[0], location[1], location[2] + 1.8))
    head = bpy.context.active_object
    for poly in head.data.polygons: poly.use_smooth = True
    
    # Body (Capsule/Cone-like cloak for a stylized Studio Ghibli traveler look)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.8, radius2=0.2, depth=2.0, location=(location[0], location[1], location[2] + 0.5))
    body = bpy.context.active_object
    for poly in body.data.polygons: poly.use_smooth = True
    
    # Join into one mesh
    bpy.context.view_layer.objects.active = body
    head.select_set(True)
    body.select_set(True)
    bpy.ops.object.join()
    char_obj = bpy.context.active_object
    char_obj.name = name
    char_obj.scale = (scale, scale, scale)
    
    mat = create_toon_material(f"{name}_Mat", color_hex)
    char_obj.data.materials.append(mat)
    apply_anime_outline(char_obj, thickness=0.03)
    
    return char_obj

def create_fluffy_tree(name, location, scale, leaf_color_hex="#388E3C"):
    # Organic Trunk
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.3, depth=3, location=(location[0], location[1], location[2]+1.5))
    trunk = bpy.context.active_object
    for poly in trunk.data.polygons: poly.use_smooth = True
    trunk.data.materials.append(create_toon_material(f"{name}_Trunk", "#5D4037"))
    apply_anime_outline(trunk)
    
    # Fluffy Cartoon Leaves (Using Displaced Icosphere)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=2.0, location=(location[0], location[1], location[2]+3.5))
    leaves = bpy.context.active_object
    
    tex = bpy.data.textures.new(f"{name}_LeafTex", type='CLOUDS')
    tex.noise_scale = 0.8
    mod = leaves.modifiers.new("Fluffy", 'DISPLACE')
    mod.texture = tex
    mod.strength = 0.6
    
    for poly in leaves.data.polygons: poly.use_smooth = True
    leaves.data.materials.append(create_toon_material(f"{name}_Leaves", leaf_color_hex))
    apply_anime_outline(leaves, thickness=0.06)
    
    leaves.parent = trunk
    trunk.scale = (scale, scale, scale)
    return trunk

def create_cinematic_text(name, text_body, location, color_hex):
    font_curve = bpy.data.curves.new(type="FONT", name=name)
    font_curve.body = text_body
    font_curve.align_x = 'CENTER'
    font_curve.align_y = 'CENTER'
    font_curve.extrude = 0.05
    font_curve.bevel_depth = 0.02
    font_obj = bpy.data.objects.new(name, font_curve)
    bpy.context.collection.objects.link(font_obj)
    font_obj.location = location
    font_obj.rotation_euler = (math.radians(80), 0, 0) # Tilted towards camera
    
    mat = bpy.data.materials.new(name=f"{name}_Text_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs[0].default_value = hex_to_rgb(color_hex)
    emission.inputs[1].default_value = 8.0 # Strong cinematic Bloom
    out = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emission.outputs[0], out.inputs[0])
    font_obj.data.materials.append(mat)
    font_obj.scale = (0.5, 0.5, 0.5)
    return font_obj

def setup_audio_sequencer(timing_data):
    if not bpy.context.scene.sequence_editor:
        bpy.context.scene.sequence_editor_create()
        
    start_frame = 1
    fps = timing_data['fps']
    audio_dir = os.path.join(ROOT_DIR, "public", "audio")
    
    for scene_timing in timing_data['scenes']:
        audio_file = os.path.join(audio_dir, scene_timing['audioFile'])
        duration_frames = scene_timing['durationFrames']
        
        if os.path.exists(audio_file):
            bpy.context.scene.sequence_editor.sequences.new_sound(
                name=f"Audio_{scene_timing['sceneId']}",
                filepath=audio_file,
                channel=1,
                frame_start=start_frame
            )
            
        start_frame += duration_frames

def build_scene(scene_idx_to_render=None):
    print("Loading Story & Timing Data...")
    with open(STORY_PATH, 'r') as f:
        story = json.load(f)
    with open(TIMING_PATH, 'r') as f:
        timing = json.load(f)

    fps = timing['fps']
    total_frames = timing['totalFrames']
    
    clear_scene()
    setup_render_settings(total_frames, fps)
    setup_lighting()
    
    cam = create_orthographic_camera()
    setup_audio_sequencer(timing)
    
    current_frame = 1
    target_frame_start = 1
    target_frame_end = total_frames
    scene_width_offset = 30.0 
    
    for idx, (scene_data, scene_timing) in enumerate(zip(story['scenes'], timing['scenes'])):
        duration_frames = scene_timing['durationFrames']
        frame_start = current_frame
        frame_end = current_frame + duration_frames - 1
        
        if scene_idx_to_render is not None and scene_idx_to_render == idx:
            target_frame_start = frame_start
            target_frame_end = frame_end
            
        x_offset = idx * scene_width_offset
        bg_colors = scene_data.get('background', {})
        pri_color = bg_colors.get('primaryColor', '#222222')
        sec_color = bg_colors.get('secondaryColor', '#444444')
        acc_color = bg_colors.get('accentColor', '#FFFFFF')

        # 1. Gradient Anime Sky Background (Z=10)
        bpy.ops.mesh.primitive_plane_add(size=40, location=(x_offset, 10, 5))
        sky = bpy.context.active_object
        sky.rotation_euler = (math.radians(90), 0, 0)
        sky.data.materials.append(create_gradient_sky_material(f"Sky_{idx}", pri_color, sec_color))
        
        # 2. Curving Toon Landscape / Ground (Z=2)
        bpy.ops.mesh.primitive_plane_add(size=30, location=(x_offset, 2, -2))
        ground = bpy.context.active_object
        ground.data.materials.append(create_toon_material(f"Ground_{idx}", sec_color))
        apply_anime_outline(ground, 0.05)
        
        # 3. Procedural Environment Scatter (Trees/Ruins)
        elements = bg_colors.get('elements', [])
        if "forest" in elements or "trees" in elements or "mountains" in elements:
            create_fluffy_tree(f"Tree1_{idx}", (x_offset - 4, 3, -2), 1.2, acc_color)
            create_fluffy_tree(f"Tree2_{idx}", (x_offset + 5, 4, -2), 0.9, sec_color)
            create_fluffy_tree(f"Tree3_{idx}", (x_offset - 6, 6, -2), 1.5, pri_color)

        # 4. Characters
        chars = scene_data.get('characters', [])
        for c_idx, char in enumerate(chars):
            pos_x = x_offset
            if char['position'] == 'left': pos_x -= 2.0
            elif char['position'] == 'right': pos_x += 2.0
            
            c_scale = char.get('scale', 1.0)
            c_obj = create_humanoid_character(f"Char_{idx}_{c_idx}", (pos_x, -1, -2), c_scale, acc_color)
            
            # Simple Bob Animation for Toon Character Idle/Walking
            c_obj.keyframe_insert(data_path="location", frame=frame_start)
            c_obj.location.z += 0.3
            c_obj.keyframe_insert(data_path="location", frame=int(frame_start + (duration_frames/2)))
            c_obj.location.z -= 0.3
            c_obj.keyframe_insert(data_path="location", frame=frame_end)

        # 5. Cinematic Text overlay
        title_text = create_cinematic_text(f"Text_{idx}", scene_data.get('title', 'Scene'), (x_offset, -4, 2), acc_color)
        title_text.keyframe_insert(data_path="location", frame=frame_start)
        title_text.location.z += 0.3
        title_text.keyframe_insert(data_path="location", frame=frame_end)

        # Ken Burns Camera movement
        cam.location.x = x_offset
        cam.keyframe_insert(data_path="location", frame=frame_start)
        
        if scene_data.get('camera') == 'zoomIn':
            cam.data.ortho_scale = 12.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.data.ortho_scale = 9.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_end)
        elif scene_data.get('camera') == 'zoomOut':
            cam.data.ortho_scale = 9.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.data.ortho_scale = 12.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_end)
        else:
            cam.data.ortho_scale = 12.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.data.ortho_scale = 11.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_end)
            
        current_frame += duration_frames

    print(f"Blender Scene Setup Complete. Total Frames: {total_frames}")
    
    if scene_idx_to_render is not None:
        bpy.context.scene.frame_start = target_frame_start
        bpy.context.scene.frame_end = target_frame_end
        bpy.context.scene.render.filepath = os.path.join(ROOT_DIR, "out", f"scene_{scene_idx_to_render}.mp4")
        print(f"Matrix Mode: Rendering ONLY Scene {scene_idx_to_render} (Frames {target_frame_start} to {target_frame_end})")
    else:
        bpy.context.scene.render.filepath = OUT_PATH
        print("Rendering full sequential timeline.")

if __name__ == "__main__":
    try:
        scene_idx = None
        if "--" in sys.argv:
            argv = sys.argv[sys.argv.index("--") + 1:]
            if "--scene-idx" in argv:
                idx_pos = argv.index("--scene-idx") + 1
                if idx_pos < len(argv):
                    scene_idx = int(argv[idx_pos])
                    
        build_scene(scene_idx)
        print("Starting Render...")
        bpy.ops.render.render(animation=True)
        print("Render Complete!")
    except Exception as e:
        print(f"ERROR: {e}")
        import sys
        sys.exit(1)
