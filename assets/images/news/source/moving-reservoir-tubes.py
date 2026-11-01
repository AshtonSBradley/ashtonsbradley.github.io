"""Regular coaxial fluid tubes for the quantum-drag news illustration.

Blender --background --factory-startup --python moving-reservoir-tubes.py
Append -- --proofs to compare three outer-layer transparencies.
The render is a schematic, with smooth visual density envelopes, not walls.
"""
from pathlib import Path
import math
import random
import sys
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
PROOFS = '--proofs' in sys.argv
PREVIEW = '--preview' in sys.argv
SMALL_RENDER = PROOFS or PREVIEW
rng = random.Random(1101026)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    if any(d.type == 'METAL' for d in prefs.devices):
        for d in prefs.devices:
            d.use = d.type == 'METAL'
        scene.cycles.device = 'GPU'
except (TypeError, RuntimeError):
    pass
scene.cycles.samples = 48 if SMALL_RENDER else 160
scene.cycles.use_denoising = True
scene.cycles.adaptive_threshold = 0.025 if SMALL_RENDER else 0.012
scene.cycles.max_bounces = 12
scene.cycles.transmission_bounces = 6
scene.cycles.transparent_max_bounces = 20
scene.render.resolution_x = 1280 if SMALL_RENDER else 2560
scene.render.resolution_y = 720 if SMALL_RENDER else 1440
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -0.25
scene.world.use_nodes = True
# Continuous studio surroundings give the metal broad, mercury-like reflections
# without reflecting rectangular lamps. The camera still sees a black backdrop.
world_nodes = scene.world.node_tree.nodes
world_nodes.clear()
world_links = scene.world.node_tree.links
direction = world_nodes.new('ShaderNodeTexCoord')
split_direction = world_nodes.new('ShaderNodeSeparateXYZ')
world_links.new(direction.outputs['Normal'], split_direction.inputs[0])
mapping = world_nodes.new('ShaderNodeMapRange')
mapping.inputs['From Min'].default_value = -1
mapping.inputs['From Max'].default_value = 1
world_links.new(split_direction.outputs['Z'], mapping.inputs['Value'])
gradient = world_nodes.new('ShaderNodeValToRGB')
gradient.color_ramp.interpolation = 'B_SPLINE'
stops = [(0.00, (0.025, 0.035, 0.055, 1)),
         (0.30, (0.30, 0.34, 0.41, 1)),
         (0.48, (0.018, 0.025, 0.045, 1)),
         (0.64, (0.10, 0.14, 0.22, 1)),
         (0.82, (0.65, 0.72, 0.84, 1)),
         (1.00, (0.90, 0.94, 1.00, 1))]
for i, (position, color) in enumerate(stops):
    element = gradient.color_ramp.elements[i] if i < 2 else gradient.color_ramp.elements.new(position)
    element.position = position
    element.color = color
world_links.new(mapping.outputs['Result'], gradient.inputs['Fac'])
reflection_world = world_nodes.new('ShaderNodeBackground')
reflection_world.inputs['Strength'].default_value = 1.0
world_links.new(gradient.outputs['Color'], reflection_world.inputs['Color'])
camera_world = world_nodes.new('ShaderNodeBackground')
camera_world.inputs['Color'].default_value = (0.009, 0.015, 0.030, 1)
camera_world.inputs['Strength'].default_value = 0.16
ray_type = world_nodes.new('ShaderNodeLightPath')
world_mix = world_nodes.new('ShaderNodeMixShader')
world_links.new(ray_type.outputs['Is Camera Ray'], world_mix.inputs[0])
world_links.new(reflection_world.outputs[0], world_mix.inputs[1])
world_links.new(camera_world.outputs[0], world_mix.inputs[2])
world_output = world_nodes.new('ShaderNodeOutputWorld')
world_links.new(world_mix.outputs[0], world_output.inputs['Surface'])


def collection(name):
    coll = bpy.data.collections.new(name)
    scene.collection.children.link(coll)
    return coll


def move(obj, coll):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    coll.objects.link(obj)


core = collection('01 | smooth blue condensate')
bath = collection('02 | transparent pink reservoir')
event = collection('03 | single collision')
studio = collection('04 | studio')


def fluid_material(name, color, surface_opacity, volume_strength, outer=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    n = mat.node_tree.nodes
    n.clear()
    links = mat.node_tree.links
    output = n.new('ShaderNodeOutputMaterial')
    transparent = n.new('ShaderNodeBsdfTransparent')
    surface = n.new('ShaderNodeBsdfPrincipled')
    surface.inputs['Base Color'].default_value = (*color, 1)
    surface.inputs['Roughness'].default_value = 0.26 if outer else 0.085
    surface.inputs['Metallic'].default_value = 0 if outer else 1.0
    surface.inputs['IOR'].default_value = 1.10 if outer else 1.28
    surface.inputs['Specular IOR Level'].default_value = 0.22 if outer else 0.34
    # Transparency is supplied by the transparent shader, without bending rays
    # or creating duplicate particle images in this schematic.
    surface.inputs['Transmission Weight'].default_value = 0.0
    surface.inputs['Emission Color'].default_value = (*color, 1)
    surface.inputs['Emission Strength'].default_value = 0.020 if outer else 0.0
    mix = n.new('ShaderNodeMixShader')
    mix.name = 'Surface opacity'
    mix.inputs[0].default_value = surface_opacity
    if outer:
        # Clear through the broad face, progressively pinker at grazing angles.
        # This makes the surrounding cylinder readable without tinting the core.
        fresnel = n.new('ShaderNodeFresnel')
        fresnel.inputs['IOR'].default_value = 1.12
        power = n.new('ShaderNodeMath')
        power.operation = 'POWER'
        power.inputs[1].default_value = 0.45
        links.new(fresnel.outputs[0], power.inputs[0])
        amount = n.new('ShaderNodeValue')
        amount.name = 'Outer surface amount'
        amount.outputs[0].default_value = surface_opacity
        mult = n.new('ShaderNodeMath')
        mult.operation = 'MULTIPLY'
        links.new(power.outputs[0], mult.inputs[0])
        links.new(amount.outputs[0], mult.inputs[1])
        opacity = n.new('ShaderNodeMath')
        opacity.operation = 'MULTIPLY_ADD'
        opacity.inputs[1].default_value = 2.0
        opacity.inputs[2].default_value = 0.012
        links.new(mult.outputs[0], opacity.inputs[0])
        links.new(opacity.outputs[0], mix.inputs[0])
    links.new(transparent.outputs[0], mix.inputs[1])
    links.new(surface.outputs['BSDF'], mix.inputs[2])
    links.new(mix.outputs[0], output.inputs['Surface'])
    vol = n.new('ShaderNodeVolumePrincipled')
    vol.name = 'Fluid body'
    vol.inputs['Color'].default_value = (*color, 1)
    vol.inputs['Density'].default_value = 0.004 if outer else 0.045
    vol.inputs['Emission Color'].default_value = (*color, 1)
    vol.inputs['Emission Strength'].default_value = volume_strength
    if outer:
        # Suppress pink emission inside the blue core. The exterior's front
        # layer is deliberately weak so the core retains its own colour.
        geo = n.new('ShaderNodeNewGeometry')
        split = n.new('ShaderNodeSeparateXYZ')
        links.new(geo.outputs['Position'], split.inputs[0])
        def calc(op, a, b):
            node = n.new('ShaderNodeMath')
            node.operation = op
            for i, value in enumerate((a, b)):
                if isinstance(value, (int, float)):
                    node.inputs[i].default_value = value
                else:
                    links.new(value, node.inputs[i])
            return node.outputs[0]
        r2 = calc('ADD', calc('MULTIPLY', split.outputs['Y'], split.outputs['Y']),
                  calc('MULTIPLY', split.outputs['Z'], split.outputs['Z']))
        ramp = calc('MINIMUM', calc('MAXIMUM', calc('MULTIPLY', calc('SUBTRACT', r2, 0.98), 4.0), 0), 1)
        strength = n.new('ShaderNodeMath')
        strength.name = 'Outer tint strength'
        strength.operation = 'MULTIPLY'
        strength.inputs[1].default_value = volume_strength
        links.new(ramp, strength.inputs[0])
        links.new(strength.outputs[0], vol.inputs['Emission Strength'])
        links.new(calc('MULTIPLY', ramp, 0.004), vol.inputs['Density'])
    links.new(vol.outputs['Volume'], output.inputs['Volume'])
    return mat


blue = fluid_material('Blue fluid | mercury-like reflection', (0.14, 0.29, 0.55), 0.88, 0.008)
pink = fluid_material('Pink fluid | restrained outer layer', (0.78, 0.10, 0.24), 0.10, 0.008, True)


def cylinder(name, radius, material, coll):
    segments = 192
    verts = [(x, radius * math.cos(2 * math.pi * i / segments),
              radius * math.sin(2 * math.pi * i / segments))
             for x in (-21, 21) for i in range(segments)]
    faces = [(i, (i + 1) % segments, (i + 1) % segments + segments, i + segments)
             for i in range(segments)]
    faces += [tuple(reversed(range(segments))), tuple(range(segments, 2 * segments))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    mesh.materials.append(material)
    for face in mesh.polygons:
        face.use_smooth = True
    return obj


cylinder('Continuous blue fluid tube', 1.00, blue, core)
# Double the exposed pink band: 1.00 + 2 * (1.46 - 1.00) = 1.92.
cylinder('Continuous surrounding pink fluid tube', 1.92, pink, bath)


def emission(name, color, strength):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    n = mat.node_tree.nodes
    n.clear()
    shader = n.new('ShaderNodeEmission')
    shader.inputs['Color'].default_value = (*color, 1)
    shader.inputs['Strength'].default_value = strength
    output = n.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(shader.outputs[0], output.inputs['Surface'])
    return mat


pink_particle = emission('Small pink bath particles', (1, 0.17, 0.30), 1.0)
pink_tail = emission('Pink leftward trajectories', (0.8, 0.075, 0.16), 0.40)
blue_particle = emission('Blue condensate particles', (0.07, 0.46, 1), 0.85)
blue_tail = emission('Blue rightward trajectories', (0.04, 0.32, 0.9), 0.45)
contact_pink = emission('Collision pink', (1, 0.23, 0.37), 2.0)
contact_blue = emission('Collision blue', (0.08, 0.58, 1), 1.8)


CAMERA_POSITION = Vector((7.5, -17.5, 8.4))
CAMERA_FORWARD = -CAMERA_POSITION.normalized()
PARTICLE_REFERENCE_DEPTH = 19.0
PINK_RADIUS = 0.030
BLUE_RADIUS = 2 * PINK_RADIUS


def particle_radius(position, radius):
    # Keep apparent sizes uniform across the perspective view, using the
    # previous foreground pink size. Blue markers have twice that diameter.
    depth = (Vector(position) - CAMERA_POSITION).dot(CAMERA_FORWARD)
    return radius * depth / PARTICLE_REFERENCE_DEPTH


def particle(name, position, radius, material, coll):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,
                                        radius=particle_radius(position, radius),
                                        location=position)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    move(obj, coll)
    for poly in obj.data.polygons:
        poly.use_smooth = True


def curve(name, points, radius, material, coll):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.bevel_depth = radius
    data.bevel_resolution = 2
    spline = data.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for i, (point, co) in enumerate(zip(spline.points, points)):
        point.co = (*co, 1)
        point.radius = max(0.06, 1 - i / (len(points) - 1))
    obj = bpy.data.objects.new(name, data)
    coll.objects.link(obj)
    data.materials.append(material)


# More numerous bath particles and condensate markers. All lie within the
# corresponding fluid envelopes; the short tails indicate opposing flow.
contact = Vector((0.35, -0.72, 0.34))
for i in range(840):
    x = rng.uniform(-17, 17)
    theta = rng.uniform(0, 2 * math.pi)
    radius = rng.uniform(0.82, 1.37)
    if radius > 1.0:
        radius = 1.0 + 2.0 * (radius - 1.0)
    p = Vector((x, radius * math.cos(theta), radius * math.sin(theta)))
    if (p - contact).length < 0.6:
        continue
    particle(f'Bath particle {i:03}', p, PINK_RADIUS, pink_particle, bath)
    length = rng.uniform(0.14, 0.28)
    curve(f'Bath leftward tail {i:03}', [p + Vector((length * j / 10, 0, 0)) for j in range(11)],
          0.0027, pink_tail, bath)
for i in range(144):
    p = Vector((rng.uniform(-17, 17), -0.45 + rng.uniform(-0.2, 0.2), rng.uniform(-0.50, 0.50)))
    if (p - contact).length < 0.6:
        continue
    particle(f'Condensate marker {i:02}', p, BLUE_RADIUS, blue_particle, core)
    curve(f'Condensate rightward tail {i:02}', [p - Vector((0.28 * j / 10, 0, 0)) for j in range(11)],
          0.0034, blue_tail, core)
particle('Single collision | blue', contact - Vector((particle_radius(contact, BLUE_RADIUS), 0, 0)), BLUE_RADIUS, contact_blue, event)
particle('Single collision | pink', contact + Vector((particle_radius(contact, PINK_RADIUS), 0, 0)), PINK_RADIUS, contact_pink, event)
curve('Collision | incoming pink', [contact + Vector((0.06 + 0.50 * j / 20, 0, 0)) for j in range(21)],
      0.0045, pink_tail, event)
curve('Collision | deflected pink', [contact + Vector((-0.50 * t, -0.13 * t, -0.21 * t)) for t in [j / 20 for j in range(21)]],
      0.0040, pink_tail, event)


camera_data = bpy.data.cameras.new('Clean perspective')
camera = bpy.data.objects.new('Clean perspective', camera_data)
studio.objects.link(camera)
camera.location = CAMERA_POSITION
camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.lens = 51
scene.camera = camera
# No bloom or texture: smoothly shaded colour and transparency carry the form.
scene.use_nodes = False
scene['illustration_note'] = 'Schematic of coaxial continuous fluid regions. Blue condensate flows +x, small pink bath particles flow -x. One small scattering encounter. The boundaries are visual envelopes, not solid walls.'
bpy.context.preferences.filepaths.save_version = 0
if PROOFS:
    proof_dir = Path('/private/tmp/quantumfluids-tube-proof')
    proof_dir.mkdir(exist_ok=True)
    for label, opacity, tint in [('light', 0.07, 0.012), ('balanced', 0.12, 0.020), ('defined', 0.20, 0.027)]:
        pink.node_tree.nodes['Outer surface amount'].outputs[0].default_value = opacity
        pink.node_tree.nodes['Outer tint strength'].inputs[1].default_value = tint
        scene.render.filepath = str(proof_dir / f'{label}.png')
        bpy.ops.render.render(write_still=True)
        print('PROOF_COMPLETE', label, flush=True)
else:
    pink.node_tree.nodes['Outer surface amount'].outputs[0].default_value = 0.10
    pink.node_tree.nodes['Outer tint strength'].inputs[1].default_value = 0.008
    scene.render.filepath = str(Path('/private/tmp/moving-reservoir-metallic-preview.png') if PREVIEW else OUT / 'moving-reservoir-tubes.png')
    if not PREVIEW:
        bpy.ops.wm.save_as_mainfile(filepath=str(HERE / 'moving-reservoir-tubes.blend'))
    bpy.ops.render.render(write_still=True)
    print('FIGURE_COMPLETE', scene.render.filepath, flush=True)
