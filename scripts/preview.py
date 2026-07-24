"""
Render a contact sheet of the exported prop kit, so the models can be judged
without going through the browser.

    blender --background --factory-startup --python scripts/preview.py -- out.png

Lit the same way the site is: one warm raking sun, cool sky fill, white card.
If a piece looks wrong here it will look wrong in the world.
"""

import math
import os
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else "preview.png"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROPS = os.path.join(ROOT, "assets", "props")

NAMES = [
    "tower",
    "monolith",
    "plinth",
    "projectarch",
    "block_tower",
    "block_step",
    "block_slab",
    "block_ell",
    "block_twin",
    "block_low",
    "workbench",
]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# lay the kit out in a row, each sitting on the ground, spaced by its own width
x = 0.0
placed = []
for n in NAMES:
    path = os.path.join(PROPS, f"{n}.glb")
    if not os.path.exists(path):
        continue
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.context.scene.objects if o not in before and o.type == "MESH"]
    if not new:
        continue
    for o in new:
        o.location.x += x
    w = max(o.dimensions.x for o in new)
    x += w + 6.0
    placed.extend(new)

span = x

# ---- ground
bpy.ops.mesh.primitive_plane_add(size=span * 3, location=(span / 2, 0, 0))
g = bpy.context.active_object
gm = bpy.data.materials.new("Ground")
gm.use_nodes = True
gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.78, 0.75, 0.71, 1)
gm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.97
g.data.materials.append(gm)

# ---- the site's light rig: warm raking sun, cool sky
bpy.ops.object.light_add(type="SUN", location=(span * 0.4, -40, 60))
sun = bpy.context.active_object
# White card under a Standard view transform clips almost immediately: at
# energy 4 every lit face pinned to pure white and the model vanished. Kept
# low, so the shading range lives between roughly 0.55 and 0.95 where the
# bevels and recesses are actually visible.
sun.data.energy = 1.9
sun.data.angle = math.radians(3.0)
sun.data.color = (1.0, 0.957, 0.886)
sun.rotation_euler = (math.radians(54), 0, math.radians(38))

world = bpy.data.worlds.new("W")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.72, 0.80, 0.89, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.45

# ---- camera: framed from the row's real bounds, so adding a prop later never
# silently pushes the kit out of shot
tallest = max((o.dimensions.z for o in placed), default=10.0)
lens = 50.0
sensor = 36.0
aspect = scene.render.resolution_x / scene.render.resolution_y
# distance needed for `span` to fit the horizontal field of view, with margin
hfov = 2 * math.atan(sensor / (2 * lens))
dist = (span * 0.58) / math.tan(hfov / 2)

bpy.ops.object.camera_add(location=(span / 2, -dist, tallest * 0.95 + dist * 0.22))
cam = bpy.context.active_object
cam.data.lens = lens
cam.data.sensor_width = sensor
cam.data.sensor_fit = "HORIZONTAL"
# pitch down onto the row; atan of rise over run keeps the horizon where we want
cam.rotation_euler = (math.pi / 2 - math.atan((tallest * 0.95 + dist * 0.22 - tallest * 0.4) / dist), 0, 0)
scene.camera = cam
del aspect

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1800
scene.render.resolution_y = 620
scene.render.film_transparent = False
scene.view_settings.view_transform = "Standard"
try:
    scene.eevee.use_raytracing = True
    scene.eevee.use_shadows = True
except Exception:
    pass

scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print("wrote", OUT, "| props:", len(placed))
