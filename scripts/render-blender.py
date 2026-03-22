import bpy
import json
import os
import math

# Get absolute paths relative to execution dir
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STORY_PATH = os.path.join(ROOT_DIR, "public", "story.json")
TIMING_PATH = os.path.join(ROOT_DIR, "public", "audio", "timing.json")
OUT_PATH = os.path.join(ROOT_DIR, "out", "video.mp4")

def hex_to_rgb(hex_value):
    """Convert hex string to Blender RGB (0-1 range)."""
    hex_value = hex_value.lstrip('#')
    if len(hex_value) == 3:
        hex_value = ''.join([c*2 for c in hex_value])
    r, g, b = tuple(int(hex_value[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    # Blender expects linear RGB, convert from sRGB
    r = math.pow(r, 2.2)
    g = math.pow(g, 2.2)
    b = math.pow(b, 2.2)
    return (r, g, b, 1.0)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    # Clear materials
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat)

def setup_render_settings(total_frames, fps=60):
    scene = bpy.context.scene
    
    # Try using Eevee Next (Blender 4.2+), fallback to standard Eevee
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        scene.render.engine = 'BLENDER_EEVEE'
        
    # Heavily optimize EEVEE render speed for flat 2D graphics
    try:
        scene.eevee.taa_render_samples = 16
        scene.eevee.taa_samples = 8
        scene.eevee.use_gtao = True
        scene.eevee.use_bloom = True
    except Exception as e:
        print(f"Notice: skipped Eevee sample optimization. {e}")
    
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.fps = fps
    
    scene.frame_start = 1
    scene.frame_end = total_frames
    
    # Setup Video output
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.audio_codec = 'AAC'
    scene.render.filepath = OUT_PATH

def create_orthographic_camera():
    cam_data = bpy.data.cameras.new("MainCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 10.0
    cam_obj = bpy.data.objects.new("MainCamera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_obj.location = (0, -10, 0)
    cam_obj.rotation_euler = (math.radians(90), 0, 0)
    return cam_obj

def create_animated_blob_bg(name, location, scale, color_hex, frame_start, frame_end):
    # Create high-res grid for organic displacement (Blob effect)
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=50, y_subdivisions=50, size=1)
    obj = bpy.context.active_object
    obj.name = name
    obj.location = location
    obj.scale = scale
    obj.rotation_euler = (math.radians(90), 0, 0)
    
    # Smooth shading
    bpy.ops.object.shade_smooth()
    
    # Emission Material (flat stylized color)
    mat = bpy.data.materials.new(name=f"{name}_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs[0].default_value = hex_to_rgb(color_hex)
    output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emission.outputs[0], output.inputs[0])
    obj.data.materials.append(mat)
    
    # Procedural Cloud Texture for Displacement
    tex = bpy.data.textures.new(f"{name}_Tex", type='CLOUDS')
    tex.noise_scale = 1.5
    
    # Displace Modifier
    mod = obj.modifiers.new("Displace", 'DISPLACE')
    mod.texture = tex
    mod.strength = 1.5
    
    # Animate displacement using an Empty
    empty = bpy.data.objects.new(f"{name}_Empty", None)
    bpy.context.collection.objects.link(empty)
    empty.location = location
    
    mod.texture_coords = 'OBJECT'
    mod.texture_coords_object = empty
    
    # Animate Empty moving on Z axis so the blob shifts organically (Vertex Paint/Displace style)
    empty.keyframe_insert(data_path="location", frame=frame_start)
    empty.location.z += 10.0
    empty.keyframe_insert(data_path="location", frame=frame_end)
    
    return obj


def create_plane(name, location, scale, color_hex):
    bpy.ops.mesh.primitive_plane_add(size=1)
    obj = bpy.context.active_object
    obj.name = name
    obj.location = location
    # Dimensions match 1080x1920 ratio: W=5.4, H=9.6 roughly
    obj.scale = scale
    obj.rotation_euler = (math.radians(90), 0, 0)
    
    mat = bpy.data.materials.new(name=f"{name}_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs[0].default_value = hex_to_rgb(color_hex)
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emission.outputs[0], output.inputs[0])
    
    obj.data.materials.append(mat)
    return obj

def create_grease_pencil_stroke(name, location, radius, color_hex):
    gp_data = bpy.data.grease_pencils.new(name)
    gp_obj = bpy.data.objects.new(name, gp_data)
    bpy.context.collection.objects.link(gp_obj)
    gp_obj.location = location
    
    # Material
    mat = bpy.data.materials.new(name=f"{name}_GP_Mat")
    bpy.data.materials.create_gpencil_data(mat)
    mat.grease_pencil.color = hex_to_rgb(color_hex)
    mat.grease_pencil.fill_color = hex_to_rgb(color_hex)
    mat.grease_pencil.show_fill = False
    mat.grease_pencil.show_stroke = True
    gp_data.materials.append(mat)
    
    # Layer & Frame
    gp_layer = gp_data.layers.new("Lines", set_active=True)
    gp_frame = gp_layer.frames.new(1)
    
    # Add abstract strokes (a sketchy spiral/orbit)
    stroke = gp_frame.strokes.new()
    stroke.display_mode = '3DSPACE'
    stroke.line_width = 80
    
    num_points = 40
    stroke.points.add(count=num_points)
    for i in range(num_points):
        # 3 loops spiral
        angle = (i / float(num_points)) * math.pi * 2 * 3 
        r = radius * (1 - i/float(num_points))
        x = math.cos(angle) * r
        y = math.sin(angle) * r
        stroke.points[i].co = (x, y, 0)
        stroke.points[i].pressure = 1.0
        
    gp_obj.rotation_euler = (math.radians(90), 0, 0)
    
    # 1. NOISE modifier: make it "boil" (hand-drawn animation feel)
    mod_noise = gp_obj.grease_pencil_modifiers.new("Noise", 'GP_NOISE')
    mod_noise.factor = 0.5
    mod_noise.step = 2 
    
    # 2. BUILD modifier: Animate stroke appearing frame-by-frame
    mod_build = gp_obj.grease_pencil_modifiers.new("Build", 'GP_BUILD')
    mod_build.mode = 'CONCURRENT'
    mod_build.start_delay = 5
    mod_build.length = 30 # Draws over 30 frames
    
    # 3. ARRAY modifier: Replicate geometric shapes (Kaleidoscope)
    mod_array = gp_obj.grease_pencil_modifiers.new("Array", 'GP_ARRAY')
    mod_array.count = 6
    mod_array.use_relative_offset = False
    
    empty_rot = bpy.data.objects.new(f"{name}_ArrayTarget", None)
    bpy.context.collection.objects.link(empty_rot)
    empty_rot.location = location
    # Rotate 60 degrees around Y (since GP is rotated 90 on X)
    empty_rot.rotation_euler = (0, math.radians(60), 0)
    mod_array.use_object_offset = True
    mod_array.offset_object = empty_rot
    
    return gp_obj

def create_cinematic_text(name, text_body, location, color_hex):
    font_curve = bpy.data.curves.new(type="FONT", name=name)
    font_curve.body = text_body
    font_curve.align_x = 'CENTER'
    font_curve.align_y = 'CENTER'
    font_curve.extrude = 0.05
    font_obj = bpy.data.objects.new(name, font_curve)
    bpy.context.collection.objects.link(font_obj)
    font_obj.location = location
    font_obj.rotation_euler = (math.radians(90), 0, 0)
    
    # Material
    mat = bpy.data.materials.new(name=f"{name}_Text_Mat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs[0].default_value = hex_to_rgb(color_hex)
    emission.inputs[1].default_value = 5.0 # Glow strength
    output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emission.outputs[0], output.inputs[0])
    font_obj.data.materials.append(mat)
    
    # Scale text to fit screen
    font_obj.scale = (0.5, 0.5, 0.5)
    return font_obj

def setup_audio_sequencer(timing_data):
    if not bpy.context.scene.sequence_editor:
        bpy.context.scene.sequence_editor_create()
        
    start_frame = 1
    fps = timing_data['fps']
    
    # Base path for audio files
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
    
    # Create Orthographic Camera
    cam = create_orthographic_camera()
    
    # Add Audio to Sequencer
    setup_audio_sequencer(timing)
    
    # Procedurally build 2D layers for each scene bounds
    current_frame = 1
    target_frame_start = 1
    target_frame_end = total_frames
    
    # We will lay out the scenes on the X axis, one per scene, and animate the camera jumping to them.
    # This avoids toggling visibility constantly.
    scene_width_offset = 20.0 
    
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
        
        # 1. Deep Background Layer (Animated Organic Blob Z=5)
        # Using the Displace technique with cloud textures to create shifting organic shapes
        bg = create_animated_blob_bg(f"BG_{idx}", (x_offset, 5, 0), (7, 12, 1), pri_color, frame_start, frame_end)
        
        # 2. Midground Layer / Mountains/City silhouette (Z=3)
        mid = create_plane(f"Mid_{idx}", (x_offset, 3, -3), (8, 4, 1), sec_color)
        
        # Add basic Line Art to midground object via Freestyle or Solidify
        # For a Line Art effect on geometry, we duplicate the object and invert faces
        # (This is a classic anime Line Art trick in Eevee without slow modifiers)
        outlinemat = bpy.data.materials.new(name=f"OutlineMat_{idx}")
        outlinemat.use_nodes = True
        out_nodes = outlinemat.node_tree.nodes
        out_nodes.clear()
        out_emission = out_nodes.new(type='ShaderNodeEmission')
        out_emission.inputs[0].default_value = (0,0,0,1) # Black outline
        out_output = out_nodes.new(type='ShaderNodeOutputMaterial')
        outlinemat.node_tree.links.new(out_emission.outputs[0], out_output.inputs[0])
        outlinemat.use_backface_culling = True 

        mod_solid = mid.modifiers.new("LineArt_Solidify", 'SOLIDIFY')
        mod_solid.thickness = -0.1
        mod_solid.use_flip_normals = True
        mid.data.materials.append(outlinemat)
        mod_solid.material_offset = 1
        
        # 3. Character Blocks (Z=1)
        # Calculate positions
        chars = scene_data.get('characters', [])
        for c_idx, char in enumerate(chars):
            # Map position to X offset
            pos_x = x_offset
            if char['position'] == 'left': pos_x -= 1.5
            elif char['position'] == 'right': pos_x += 1.5
            
            # Simple Character Representation (Colored Box)
            c_scale = char.get('scale', 1.0)
            c_plane = create_plane(f"Char_{idx}_{c_idx}", (pos_x, 1, -2), (1.5 * c_scale, 3.5 * c_scale, 1), acc_color)
            
            # Add abstract boiling grease pencil geometry around the character for that 2D anime feel
            gp_stroke = create_grease_pencil_stroke(f"Char_Energy_{idx}_{c_idx}", (pos_x, 1, -1.9), 2.0 + c_scale, acc_color)
            
            # Simple Bob Animation for Character
            c_plane.keyframe_insert(data_path="location", frame=frame_start)
            c_plane.location.z += 0.2
            c_plane.keyframe_insert(data_path="location", frame=int(frame_start + (duration_frames/2)))
            c_plane.location.z -= 0.2
            c_plane.keyframe_insert(data_path="location", frame=frame_end)

            # Bob the Grease Pencil geometry synchronously
            gp_stroke.keyframe_insert(data_path="location", frame=frame_start)
            gp_stroke.location.z += 0.2
            gp_stroke.keyframe_insert(data_path="location", frame=int(frame_start + (duration_frames/2)))
            gp_stroke.location.z -= 0.2
            gp_stroke.keyframe_insert(data_path="location", frame=frame_end)

        # 4. Cinematic Text overlay (Z=-1 close to camera)
        title_text = create_cinematic_text(f"Text_{idx}", scene_data.get('title', 'Scene'), (x_offset, -3, -1), acc_color)
        title_text.keyframe_insert(data_path="location", frame=frame_start)
        title_text.location.z += 0.5
        title_text.keyframe_insert(data_path="location", frame=frame_end)

        # Animate Camera to this scene bounds
        # Keep camera statically over this scene, but we can do slow pans
        cam.location.x = x_offset
        cam.keyframe_insert(data_path="location", frame=frame_start)
        
        if scene_data.get('camera') == 'zoomIn':
            cam.data.ortho_scale = 10.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.data.ortho_scale = 8.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_end)
        elif scene_data.get('camera') == 'zoomOut':
            cam.data.ortho_scale = 8.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.data.ortho_scale = 10.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_end)
        else:
            # Default Slow Push
            cam.data.ortho_scale = 10.0
            cam.data.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.data.ortho_scale = 9.5
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
        import sys
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
