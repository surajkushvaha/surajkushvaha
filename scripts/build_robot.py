"""
Builds the site's robot and exports it to assets/robot.glb.

Run headless:
    "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" \
        --background --python scripts/build_robot.py

The asset is *generated*, not downloaded, so it lives in git as a script that
anyone can read, diff and re-run — not as an opaque binary nobody can change.

Design notes, since they are the reason it looks the way it does:
  - A cute robot is a *proportion* trick, not a detail trick: an oversized head,
    a small body, and stubby limbs. Detail actively hurts — the reference bots
    are almost entirely primitives.
  - The eyes carry all of the personality. They are big, rounded, and emissive,
    on a dark visor so they read as *lit* rather than painted on.
  - Everything is a bevelled cube or a squashed sphere. Nothing is sculpted.

Blender is Z-up and faces -Y; glTF is Y-up and faces +Z. The exporter converts,
so the face is built on -Y here and arrives facing the camera in three.js.
"""

import math

import bpy
import mathutils

OUT = bpy.path.abspath("//assets/robot.glb")

# ---------------------------------------------------------------- scene reset

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for block in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.actions):
    for item in list(block):
        block.remove(item)


# ---------------------------------------------------------------- materials


def material(name, color, emissive=None, roughness=0.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0.0
    if emissive:
        bsdf.inputs["Emission Color"].default_value = (*emissive, 1)
        bsdf.inputs["Emission Strength"].default_value = 1.0
    return mat


SHELL = material("Shell", (0.94, 0.94, 0.96), roughness=0.35)  # the white body
DARK = material("Visor", (0.04, 0.04, 0.05), roughness=0.2)  # the face plate
EYE = material("Eye", (0.16, 0.10, 0.38), emissive=(0.62, 0.42, 1.0), roughness=0.1)
TRIM = material("Trim", (0.62, 0.63, 0.68), roughness=0.5)  # joints


# ---------------------------------------------------------------- primitives


def box(name, loc, scale, mat, bevel=0.35, segments=5):
    """
    A rounded box. The bevel is what makes it read as soft rather than machined.

    `size=2` gives a cube of half-extent 1, so `scale` means half-extents — the
    same as `ball`'s radii. With `size=1` the two primitives disagree by a factor
    of two and the robot comes apart into floating pieces.
    """
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.transform_apply(scale=True)

    b = ob.modifiers.new("bevel", "BEVEL")
    # bevel width is relative to the smallest dimension, so a squat box does not
    # get a bevel wider than itself and fold inside out
    b.width = min(scale) * bevel
    b.segments = segments
    b.limit_method = "ANGLE"

    ob.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return ob


def ball(name, loc, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    ob.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return ob


# ---------------------------------------------------------------- the robot
# Proportions are the whole design: head is deliberately larger than the torso.

parts = []

# torso — small, so the head reads as big
parts.append((box("Torso", (0, 0, 0.55), (0.22, 0.18, 0.23), SHELL), "Torso"))
parts.append((box("Collar", (0, 0, 0.76), (0.14, 0.13, 0.04), TRIM), "Torso"))

# head — the star. wide, rounded, oversized.
parts.append((box("Head", (0, 0, 1.06), (0.40, 0.34, 0.32), SHELL), "Head"))
# the visor sits proud of the face so the eyes have something dark to sit in
parts.append((box("Visor", (0, -0.30, 1.08), (0.30, 0.06, 0.17), DARK, bevel=0.45), "Head"))
# The eyes are skinned to their own bones. That is what makes expressions
# possible at all: squash a bone and the eye squints, tilt it and the eye slants.
# It is a cheaper and far more legible face than morph targets on a visor.
parts.append((ball("Eye_L", (0.145, -0.345, 1.09), (0.085, 0.05, 0.085), EYE), "Eye_L"))
parts.append((ball("Eye_R", (-0.145, -0.345, 1.09), (0.085, 0.05, 0.085), EYE), "Eye_R"))

# ears / headphones — reads as friendly, and hides the head/visor seam
parts.append((ball("Ear_L", (0.41, 0, 1.06), (0.06, 0.10, 0.10), TRIM), "Head"))
parts.append((ball("Ear_R", (-0.41, 0, 1.06), (0.06, 0.10, 0.10), TRIM), "Head"))

# antenna with a lit bulb — the classic "this thing is on" cue
parts.append((box("Antenna", (0, 0, 1.44), (0.012, 0.012, 0.10), TRIM, bevel=0.2), "Head"))
parts.append((ball("Bulb", (0, 0, 1.56), (0.05, 0.05, 0.05), EYE), "Head"))

# arms — stubby, hanging. a rounded arm plus a ball hand.
for side, x in (("L", 1), ("R", -1)):
    parts.append((box(f"Arm_{side}", (0.31 * x, 0, 0.56), (0.055, 0.055, 0.16), SHELL), f"Arm_{side}"))
    parts.append((ball(f"Hand_{side}", (0.31 * x, 0, 0.37), (0.075, 0.075, 0.075), TRIM), f"Arm_{side}"))

# legs — short. a tall robot is not a cute robot.
for side, x in (("L", 1), ("R", -1)):
    parts.append((box(f"Leg_{side}", (0.14 * x, 0, 0.22), (0.075, 0.075, 0.11), TRIM), f"Leg_{side}"))
    parts.append((box(f"Foot_{side}", (0.14 * x, -0.03, 0.05), (0.10, 0.14, 0.05), SHELL), f"Leg_{side}"))


# ---------------------------------------------------------------- armature

bpy.ops.object.armature_add(location=(0, 0, 0))
rig = bpy.context.object
rig.name = "Rig"
arm = rig.data
arm.name = "Rig"

bpy.ops.object.mode_set(mode="EDIT")
edit = arm.edit_bones
edit.remove(edit[0])  # drop the default bone


def bone(name, head, tail, parent=None):
    b = edit.new(name)
    b.head = head
    b.tail = tail
    if parent:
        b.parent = edit[parent]
    return b


bone("Root", (0, 0, 0), (0, 0, 0.18))
bone("Torso", (0, 0, 0.30), (0, 0, 0.80), "Root")
bone("Head", (0, 0, 0.82), (0, 0, 1.40), "Torso")
bone("Eye_L", (0.145, -0.345, 1.09), (0.145, -0.345, 1.19), "Head")
bone("Eye_R", (-0.145, -0.345, 1.09), (-0.145, -0.345, 1.19), "Head")
bone("Arm_L", (0.31, 0, 0.70), (0.31, 0, 0.36), "Torso")
bone("Arm_R", (-0.31, 0, 0.70), (-0.31, 0, 0.36), "Torso")
bone("Leg_L", (0.14, 0, 0.32), (0.14, 0, 0.04), "Root")
bone("Leg_R", (-0.14, 0, 0.32), (-0.14, 0, 0.04), "Root")

bpy.ops.object.mode_set(mode="OBJECT")

# Each part is rigid and belongs to exactly one bone — no weight painting, no
# soft deformation. A hard-surface robot should not bend like flesh.
for ob, bone_name in parts:
    # The meshes MUST NOT share a name with a bone. three.js binds animation
    # tracks by node name, so a mesh called "Arm_L" and a bone called "Arm_L"
    # are ambiguous — the track binds to the mesh, and a skinned mesh's own
    # transform is ignored during skinning, so the arm silently never moves.
    ob.name = f"m_{ob.name}"

    group = ob.vertex_groups.new(name=bone_name)
    group.add(range(len(ob.data.vertices)), 1.0, "REPLACE")
    mod = ob.modifiers.new("rig", "ARMATURE")
    mod.object = rig
    ob.parent = rig

for pb in rig.pose.bones:
    pb.rotation_mode = "QUATERNION"


# ---------------------------------------------------------------- animation

R = math.radians


def action(name):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True  # or Blender garbage-collects it before export
    rig.animation_data_create()
    rig.animation_data.action = act
    return act


def key(bone_name, frame, swing=0, lift=0, twist=0, loc=None, scale=None):
    """
    Pose a bone by rotating it about *world* axes, not local euler components.

    This is the whole reason the arms took so long to move. A bone's local Y runs
    along its own length, so a local-Y rotation is a twist and is invisible; and
    which local euler maps to a visible swing depends on the bone's roll, which
    is not something to guess at. Instead the world axis is converted into the
    bone's rest space, and we rotate about that. Then:

        swing  — rotates about world Y: an arm lifts out sideways, a head turns
        lift   — rotates about world X: an arm swings forward, a head nods
        twist  — rotates about world Z: a head tilts

    These do what their names say regardless of how the bone was built.
    """
    pb = rig.pose.bones[bone_name]
    basis = pb.bone.matrix_local.to_3x3().inverted()

    rot = mathutils.Quaternion((1, 0, 0, 0))
    for angle, world_axis in (
        (swing, (0, 1, 0)),
        (lift, (1, 0, 0)),
        (twist, (0, 0, 1)),
    ):
        if angle:
            local_axis = basis @ mathutils.Vector(world_axis)
            rot = rot @ mathutils.Quaternion(local_axis, R(angle))

    pb.rotation_quaternion = rot
    pb.keyframe_insert("rotation_quaternion", frame=frame)
    if loc:
        pb.location = loc
        pb.keyframe_insert("location", frame=frame)
    if scale:
        pb.scale = scale
        pb.keyframe_insert("scale", frame=frame)


def rest():
    for pb in rig.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)


# --- Idle: a slow breath-bob. First and last frame identical, or it hitches.
rest()
action("Idle")
for f, z, nod, arm in ((1, 0, 0, 0), (30, 0.035, -3, 6), (60, 0, 0, 0)):
    key("Root", f, loc=(0, 0, z))
    key("Head", f, lift=nod)
    key("Arm_L", f, lift=arm)
    key("Arm_R", f, lift=arm)

# --- Wave: raises its left arm and waves. The head tips toward the wave, which
# is what stops it reading as a robot-arm test and starts it reading as friendly.
rest()
action("Wave")
key("Arm_L", 1, swing=0)
key("Head", 1, swing=0)
key("Arm_L", 10, swing=-145)
key("Head", 10, swing=-10, twist=8)
for f, w in ((18, -120), (26, -160), (34, -120), (42, -150)):
    key("Arm_L", f, swing=w)
key("Arm_L", 55, swing=0)
key("Head", 55, swing=0)

# --- Yes: two nods.
rest()
action("Yes")
for f, a in ((1, 0), (8, 24), (16, -4), (24, 24), (32, 0), (40, 0)):
    key("Head", f, lift=a)

# --- No: two head shakes.
rest()
action("No")
for f, a in ((1, 0), (9, 28), (19, -28), (29, 16), (38, 0), (45, 0)):
    key("Head", f, swing=a)

# --- Jump: anticipate (squash), leap, land, settle. The squash is what sells it.
rest()
action("Jump")
key("Root", 1, loc=(0, 0, 0), scale=(1, 1, 1))
key("Root", 7, loc=(0, 0, -0.05), scale=(1.12, 1.12, 0.85))
key("Root", 16, loc=(0, 0, 0.42), scale=(0.9, 0.9, 1.15))
key("Root", 26, loc=(0, 0, 0), scale=(1.1, 1.1, 0.88))
key("Root", 36, loc=(0, 0, 0), scale=(1, 1, 1))
for f, a in ((1, 0), (16, -130), (36, 0)):
    key("Arm_L", f, swing=a)
    key("Arm_R", f, swing=-a)

# --- Dance: what it does when you leave it alone too long.
rest()
action("Dance")
for i, f in enumerate(range(1, 97, 12)):
    d = 1 if i % 2 == 0 else -1
    key("Root", f, loc=(0.05 * d, 0, 0.02))
    key("Torso", f, swing=10 * d)
    key("Head", f, swing=-14 * d, lift=4)
    key("Arm_L", f, swing=-70 - 50 * d)
    key("Arm_R", f, swing=70 + 50 * d)

rig.animation_data.action = bpy.data.actions["Idle"]
rest()


# ---------------------------------------------------------------- export

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_apply=True,  # bake the bevels; the mesh must arrive rounded
    export_animations=True,
    export_animation_mode="ACTIONS",  # one glTF animation per action
    export_yup=True,
)
print(f"WROTE {OUT}")
