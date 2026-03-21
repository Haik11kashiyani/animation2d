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
    scene.render.engine = 'BLENDER_EEVEE_NEXT' if hasattr(bpy.context.scene.render, 'engine') and 'BLENDER_EEVEE_NEXT' in [i.identifier for i in bpy.types.RenderEngine.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
    
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

def build_scene():
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
    
    # We will lay out the scenes on the X axis, one per scene, and animate the camera jumping to them.
    # This avoids toggling visibility constantly.
    scene_width_offset = 20.0 
    
    for idx, (scene_data, scene_timing) in enumerate(zip(story['scenes'], timing['scenes'])):
        duration_frames = scene_timing['durationFrames']
        frame_start = current_frame
        frame_end = current_frame + duration_frames - 1
        x_offset = idx * scene_width_offset
        
        bg_colors = scene_data.get('background', {})
        pri_color = bg_colors.get('primaryColor', '#222222')
        sec_color = bg_colors.get('secondaryColor', '#444444')
        acc_color = bg_colors.get('accentColor', '#FFFFFF')
        
        # 1. Deep Background Layer (Z=5)
        bg = create_plane(f"BG_{idx}", (x_offset, 5, 0), (7, 12, 1), pri_color)
        
        # 2. Midground Layer / Mountains/City silhouette (Z=3)
        mid = create_plane(f"Mid_{idx}", (x_offset, 3, -3), (8, 4, 1), sec_color)
        
        # 3. Character Blocks (Z=1)
        # Calculate positions
        chars = scene_data.get('characters', [])
        for c_idx, char in enumerate(chars):
            # Map position to X offset
            pos_x = x_offset
            if char['position'] == 'left': pos_x -= 1.5
            elif char['position'] == 'right': pos_x += 1.5
            
            # Simple Character Representation (Colored Box)
            # A full procedural 2D grease-pencil character requires pre-made assets. 
            # We use primitive planes representing 2D cutouts for now.
            c_scale = char.get('scale', 1.0)
            c_plane = create_plane(f"Char_{idx}_{c_idx}", (pos_x, 1, -2), (1.5 * c_scale, 3.5 * c_scale, 1), acc_color)
            
            # Simple Bob Animation for Character
            c_plane.keyframe_insert(data_path="location", frame=frame_start)
            c_plane.location.z += 0.2
            c_plane.keyframe_insert(data_path="location", frame=frame_start + (duration_frames//2))
            c_plane.location.z -= 0.2
            c_plane.keyframe_insert(data_path="location", frame=frame_end)

        # Animate Camera to this scene bounds
        # Keep camera statically over this scene, but we can do slow pans
        cam.location.x = x_offset
        cam.keyframe_insert(data_path="location", frame=frame_start)
        
        if scene_data.get('camera') == 'zoomIn':
            cam.ortho_scale = 10.0
            cam.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.ortho_scale = 8.0
            cam.keyframe_insert(data_path="ortho_scale", frame=frame_end)
        elif scene_data.get('camera') == 'zoomOut':
            cam.ortho_scale = 8.0
            cam.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.ortho_scale = 10.0
            cam.keyframe_insert(data_path="ortho_scale", frame=frame_end)
        else:
            # Default Slow Push
            cam.ortho_scale = 10.0
            cam.keyframe_insert(data_path="ortho_scale", frame=frame_start)
            cam.ortho_scale = 9.5
            cam.keyframe_insert(data_path="ortho_scale", frame=frame_end)
            
        current_frame += duration_frames

    print(f"Blender Scene Setup Complete. Total Frames: {total_frames}")

if __name__ == "__main__":
    try:
        build_scene()
        print("Starting Render...")
        bpy.ops.render.render(animation=True)
        print("Render Complete!")
    except Exception as e:
        print(f"ERROR: {e}")
        import sys
        sys.exit(1)
