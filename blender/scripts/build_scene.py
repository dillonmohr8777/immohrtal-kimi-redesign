#!/usr/bin/env python3
"""
IMMOHRTAL — Pittsburgh concert venue generator.

Repeatable, batched scene build for the reusable master scene
`blender/immohrtal-pittsburgh-concert.blend` and the optimized web export
`public/models/immohrtal-pittsburgh-concert.glb`.

Run headless from the repository root:

    blender -b -P blender/scripts/build_scene.py -- --all
    blender -b -P blender/scripts/build_scene.py -- --export-glb --quick
    blender -b -P blender/scripts/build_scene.py -- --previews-only

Collections:
    CITY        Pittsburgh exterior: rivers, hills, yellow bridges, skyline
    VENUE_EXT   Arena shell, entry sequence, marquee, concourse ring
    VENUE_INT   Bowl seating, floor, backstage
    STAGE       Deck, thrust, backline, screens, truss, speakers, lasers
    LIGHTING    Spot fixtures + cue groups (CUE_T01..CUE_T11)
    CROWD       Instanced audience (shared meshes, per-node phase extras)
    PERFORMER   Stylized IMMOHRTAL likeness (black 814 crewneck)
    CAMERAS     Named shot cameras (exterior arrival .. finale)
    EXPORT      Flattened web-export copies (transforms applied)

The web integration (src/concert/) drives everything by object name and by
the JSON cue sheet stored on the CUE_SHEET empty's `chapters` custom prop,
so final mastered audio can be swapped in without rebuilding the scene.
"""

import bpy
import json
import math
import os
import random
import sys

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def has(flag):
    return flag in argv


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
BLEND_PATH = os.path.join(REPO_ROOT, "blender", "immohrtal-pittsburgh-concert.blend")
GLB_PATH = os.path.join(REPO_ROOT, "public", "models", "immohrtal-pittsburgh-concert.glb")
PREVIEW_DIR = os.path.join(REPO_ROOT, "blender", "previews")
REFERENCE_DIR = os.path.join(REPO_ROOT, "blender", "references")
POSTER_PATH = os.path.join(REPO_ROOT, "public", "models", "concert-poster.jpg")

QUICK = has("--quick")
DO_ALL = has("--all") or not any([has("--export-glb"), has("--previews-only"), has("--no-render")])
DO_EXPORT = DO_ALL or has("--export-glb")
DO_RENDER = (DO_ALL or has("--previews-only")) and not has("--no-render")
DO_SAVE = DO_ALL or has("--save-blend")

random.seed(814)

# Palette (site tokens: paper, gunmetal, electric blue signal, green)
PAPER = (0.968, 0.976, 0.984, 1.0)
GUNMETAL = (0.078, 0.098, 0.133, 1.0)
GUNMETAL_DARK = (0.045, 0.055, 0.078, 1.0)
CHROME = (0.42, 0.48, 0.56, 1.0)
SIGNAL = (0.122, 0.620, 1.000, 1.0)
SIGNAL_DEEP = (0.05, 0.28, 0.75, 1.0)
GREEN = (0.090, 0.658, 0.420, 1.0)
PGH_GOLD = (0.95, 0.72, 0.18, 1.0)
ALBUM_RED = (0.72, 0.10, 0.12, 1.0)
ALBUM_BLUE = (0.10, 0.24, 0.62, 1.0)
RIVER = (0.03, 0.07, 0.12, 1.0)
NIGHT = (0.012, 0.02, 0.045, 1.0)
SKIN = (0.78, 0.60, 0.48, 1.0)
HAIR = (0.06, 0.05, 0.05, 1.0)

# 11 album chapters (titles match src/content/album.ts). Mirrored in
# src/content/concert-cues.ts for the web runtime.
CHAPTERS = [
    {"track": 1, "title": "No Way Out", "chapter": "Cold Open", "primary": "#1f9eff", "secondary": "#0d2a4a", "energy": 0.35, "camera": "CAM_FOH"},
    {"track": 2, "title": "Picking Up My Notepad", "chapter": "Paper", "primary": "#f7f9fb", "secondary": "#1f9eff", "energy": 0.45, "camera": "CAM_Performer_CloseUp"},
    {"track": 3, "title": "814 Blood (ft. King Keev)", "chapter": "Steel", "primary": "#c21f2c", "secondary": "#1f4f9e", "energy": 0.9, "camera": "CAM_Pit"},
    {"track": 4, "title": "My Mothers Baby", "chapter": "Ember", "primary": "#f5a63b", "secondary": "#7a3b12", "energy": 0.4, "camera": "CAM_Stage"},
    {"track": 5, "title": "Roll the Dice", "chapter": "Green Room", "primary": "#17a86b", "secondary": "#0a3a24", "energy": 0.8, "camera": "CAM_FOH"},
    {"track": 6, "title": "My Own Way", "chapter": "Signal", "primary": "#1f9eff", "secondary": "#17a86b", "energy": 0.75, "camera": "CAM_Pit"},
    {"track": 7, "title": "Headstone (Interlude)", "chapter": "Interlude", "primary": "#f7f9fb", "secondary": "#141922", "energy": 0.15, "camera": "CAM_Performer_CloseUp"},
    {"track": 8, "title": "Grade A Love", "chapter": "Bloom", "primary": "#c86bd8", "secondary": "#17a86b", "energy": 0.55, "camera": "CAM_Stage"},
    {"track": 9, "title": "On My Way (ft. King Keev)", "chapter": "Arrival", "primary": "#f2b82e", "secondary": "#1f9eff", "energy": 0.85, "camera": "CAM_Aerial_Pittsburgh"},
    {"track": 10, "title": "Waitlist", "chapter": "Holding Pattern", "primary": "#2fd4c4", "secondary": "#0d2a4a", "energy": 0.6, "camera": "CAM_FOH"},
    {"track": 11, "title": "Dance with the Delusional (ft. Ted Moon)", "chapter": "Finale", "primary": "#c21f2c", "secondary": "#1f9eff", "energy": 1.0, "camera": "CAM_Finale"},
]

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def collection(name, parent=None):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if parent:
        if c.name not in parent.children:
            parent.children.link(c)
    elif c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


def move_to(obj, coll):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)


def mat_principled(name, color, metallic=0.0, roughness=0.55, emission=None, emission_strength=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m


def mat_emissive(name, color, strength=6.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = color
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return m


def cube(name, loc, scale, mat, coll, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (scale[0] / 2, scale[1] / 2, scale[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    if mat:
        o.data.materials.append(mat)
    if bevel > 0:
        mod = o.modifiers.new("soft", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    move_to(o, coll)
    return o


def cyl(name, loc, radius, depth, mat, coll, vertices=12, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    o = bpy.context.object
    o.name = name
    if rotation:
        o.rotation_euler = rotation
    if mat:
        o.data.materials.append(mat)
    move_to(o, coll)
    return o


def uv_sphere(name, loc, radius, mat, coll, segments=16, rings=12, scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=radius, location=loc)
    o = bpy.context.object
    o.name = name
    if scale:
        o.scale = scale
        bpy.ops.object.transform_apply(scale=True)
    if mat:
        o.data.materials.append(mat)
    move_to(o, coll)
    return o


def text_mesh(name, body, loc, size, mat, coll, rotation=(math.radians(90), 0, 0), extrude=0.06, align="CENTER"):
    bpy.ops.object.text_add(location=loc, rotation=rotation)
    t = bpy.context.object
    t.name = name
    t.data.body = body
    t.data.align_x = align
    t.data.size = size
    t.data.extrude = extrude
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.object
    o.name = name
    if mat:
        o.data.materials.append(mat)
    move_to(o, coll)
    return o


def empty(name, loc, coll, props=None):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    coll.objects.link(o)
    if props:
        for k, v in props.items():
            o[k] = v
    return o


def look_at(obj, target):
    from mathutils import Vector
    direction = (Vector(target) - obj.location).normalized()
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


# --------------------------------------------------------------------------
# CITY — Pittsburgh exterior
# --------------------------------------------------------------------------


def build_city(mats, coll):
    # Rivers: Allegheny + Monongahela joining into the Ohio (the Point).
    cube("RIVER_Allegheny", (-30, 60, -0.2), (220, 26, 0.4), mats["river"], coll)
    ohio = cube("RIVER_Ohio", (-95, 8, -0.2), (110, 24, 0.4), mats["river"], coll)
    ohio.rotation_euler[2] = math.radians(38)
    mono = cube("RIVER_Monongahela", (30, -45, -0.2), (160, 22, 0.4), mats["river"], coll)
    mono.rotation_euler[2] = math.radians(-18)

    cube("CITY_Ground", (0, 0, -0.55), (260, 200, 0.8), mats["ground"], coll)

    # Downtown skyline cluster (Golden Triangle) west of the venue.
    skyline = [
        ("USSteelTower", (-72, 26), 10, 64, mats["tower_dark"]),
        ("BNYCtr", (-60, 34), 8, 44, mats["tower_glass"]),
        ("PPGPlace", (-52, 24), 7, 38, mats["tower_glass"]),
        ("FifthAvePl", (-64, 16), 6, 30, mats["tower_mid"]),
        ("Koppers", (-48, 32), 5, 26, mats["tower_mid"]),
        ("GulfTwr", (-80, 36), 6, 34, mats["tower_dark"]),
        ("GrantBldg", (-56, 12), 5, 22, mats["tower_mid"]),
        ("OneOxford", (-44, 20), 6, 24, mats["tower_glass"]),
    ]
    win = mats["windows"]
    for name, (x, y), w, h, m in skyline:
        cube(f"SKY_{name}", (x, y, h / 2), (w, w, h), m, coll, bevel=0.4)
        floors = max(2, int(h // 9))
        for i in range(floors):
            z = 5 + i * (h - 8) / floors
            cube(f"SKY_{name}_win{i}", (x, y - w / 2 - 0.06, z), (w * 0.72, 0.12, 1.1), win, coll)

    # Three Sisters-style yellow bridges across the Allegheny.
    for i, x in enumerate((-34, -18, -2)):
        y = 60
        deck = cube(f"BRIDGE_{i}_deck", (x, y, 3.2), (4.4, 34, 1.0), mats["bridge_gold"], coll)
        deck.rotation_euler[2] = math.radians(4)
        for side in (-1, 1):
            bpy.ops.mesh.primitive_torus_add(major_radius=9.5, minor_radius=0.55, major_segments=24, minor_segments=6,
                                             location=(x + side * 1.9, y, 3.2))
            arch = bpy.context.object
            arch.name = f"BRIDGE_{i}_arch{side}"
            arch.scale = (1, 1, 0.55)
            arch.rotation_euler[0] = math.radians(90)
            bpy.ops.object.transform_apply(scale=True)
            arch.data.materials.append(mats["bridge_gold"])
            move_to(arch, coll)
            for k in range(5):
                t = -0.75 + k * 0.375
                vx = x + side * 1.9
                vy = y + t * 9.5
                vz = 3.2 + math.cos(t * math.pi / 2) * 5.2 * 0.55 + 0.4
                cyl(f"BRIDGE_{i}_hanger{side}_{k}", (vx, vy, (3.7 + vz) / 2), 0.12,
                    abs(vz - 3.7) + 0.6, mats["bridge_gold"], coll, vertices=6)

    # Mount Washington hill ridge + scattered house lights.
    for i, (x, y, sx, sy, h) in enumerate([(-40, 105, 160, 40, 16), (60, 100, 120, 36, 13), (-120, 90, 90, 30, 11)]):
        uv_sphere(f"HILL_{i}", (x, y, -2), 1.0, mats["hill"], coll, segments=20, rings=10, scale=(sx, sy, h))
    for i in range(46):
        x = random.uniform(-110, 30)
        y = random.uniform(88, 116)
        cube(f"HILL_light_{i}", (x, y, random.uniform(2.5, 9)), (0.5, 0.5, 0.35), mats["windows"], coll)

    # Street lighting grid around the venue.
    for i in range(26):
        x = -40 + (i % 13) * 7.5
        y = -38 if i < 13 else 34
        cyl(f"STREET_pole_{i}", (x, y, 3.2), 0.09, 6.4, mats["gunmetal"], coll, vertices=6)
        cube(f"STREET_lamp_{i}", (x, y, 6.5), (1.1, 0.4, 0.3), mats["lamp"], coll)

    # Night sky dome + moon.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=400, location=(0, 0, 0))
    sky = bpy.context.object
    sky.name = "SKY_Dome"
    sky.scale = (1, 1, 0.55)
    sky.data.materials.append(mats["sky"])
    for poly in sky.data.polygons:
        poly.use_smooth = True
    move_to(sky, coll)
    cyl("SKY_Moon", (-120, 150, 120), 9, 1, mats["moon"], coll, vertices=24, rotation=(math.radians(90), 0, 0))


# --------------------------------------------------------------------------
# VENUE — arena exterior, entry sequence, interior bowl
# --------------------------------------------------------------------------

ARENA_X = 0
ARENA_Y = -10
FLOOR_Z = 1.0
STAGE_Y = -26.0  # stage front edge sits toward -Y; crowd faces -Y


def build_venue_ext(mats, coll):
    x, y = ARENA_X, ARENA_Y
    # Main shell: faceted drum + paper band with venue name.
    cyl("VENUE_shell", (x, y, 14), 46, 28, mats["venue_wall"], coll, vertices=48)
    cyl("VENUE_band", (x, y, 24.5), 46.4, 3.0, mats["paper"], coll, vertices=48)
    # Open oculus ring roof: reads as an arena ring from the air and lets
    # house/stage light reach the bowl instead of sealing it under a lid.
    bpy.ops.mesh.primitive_torus_add(major_radius=40, minor_radius=3.6, major_segments=48, minor_segments=10,
                                     location=(x, y, 29.4))
    roof = bpy.context.object
    roof.name = "VENUE_roof_ring"
    roof.data.materials.append(mats["gunmetal"])
    move_to(roof, coll)
    # Exterior accent ring so the venue glows on the skyline at night.
    bpy.ops.mesh.primitive_torus_add(major_radius=46.5, minor_radius=0.55, major_segments=48, minor_segments=6,
                                     location=(x, y, 21.5))
    glow = bpy.context.object
    glow.name = "VENUE_accent_ring"
    glow.data.materials.append(mats["signal_emit"])
    move_to(glow, coll)

    # Entry sequence: glass atrium, canopy, doors, plaza.
    cube("VENUE_atrium", (x, y + 44, 7), (30, 10, 14), mats["tower_glass"], coll, bevel=0.5)
    cube("VENUE_canopy", (x, y + 50, 9.5), (36, 12, 1.1), mats["bridge_gold"], coll, bevel=0.3)
    for i in range(5):
        cube(f"VENUE_door_{i}", (x - 12 + i * 6, y + 49, 3), (3.4, 0.5, 6), mats["signal_emit"], coll)
    cube("VENUE_plaza", (x, y + 52, 0.15), (44, 18, 0.3), mats["plaza"], coll)

    # Marquee: gunmetal slab + IMMOHRTAL in emissive signal + gold underline.
    cube("MARQUEE_slab", (x, y + 46.2, 17), (26, 1.2, 6.4), mats["gunmetal"], coll, bevel=0.4)
    # Text stands upright facing +Y (the arrival approach).
    text_mesh("MARQUEE_text", "IMMOHRTAL", (x, y + 46.9, 17.6), 3.2, mats["signal_emit"], coll,
              rotation=(math.radians(-90), math.radians(180), 0), extrude=0.12)
    cube("MARQUEE_rule", (x, y + 46.9, 14.6), (20, 0.3, 0.5), mats["bridge_gold"], coll)
    text_mesh("MARQUEE_sub", "DANCE WITH THE DELUSIONAL  ·  PITTSBURGH PA", (x, y + 46.9, 13.4), 0.85,
              mats["paper_emit"], coll, rotation=(math.radians(-90), math.radians(180), 0), extrude=0.05)

    # Banners down the plaza (signal / green alternating).
    for i in range(6):
        bx = x - 18 + i * 7.2
        cyl(f"BANNER_pole_{i}", (bx, y + 55, 3.4), 0.09, 6.8, mats["gunmetal"], coll, vertices=6)
        cube(f"BANNER_flag_{i}", (bx, y + 55, 5.6), (1.6, 0.12, 2.6),
             mats["signal_emit"] if i % 2 == 0 else mats["green_emit"], coll)

    # Concourse ring + interior accent strips (visible inside the bowl).
    cyl("CONCOURSE_ring", (x, y, 10.5), 41, 2.2, mats["concourse"], coll, vertices=48)
    for i, z in enumerate((13.5, 18.5)):
        bpy.ops.mesh.primitive_torus_add(major_radius=44.8, minor_radius=0.32, major_segments=48, minor_segments=6,
                                         location=(x, y, z))
        strip = bpy.context.object
        strip.name = f"CONCOURSE_strip_{i}"
        strip.data.materials.append(mats["signal_emit"])
        move_to(strip, coll)


def build_venue_int(mats, coll):
    x, y = ARENA_X, ARENA_Y
    # Floor.
    cyl("FLOOR_main", (x, y, FLOOR_Z - 0.5), 40, 1.0, mats["floor"], coll, vertices=48)

    # Bowl seating: three raked tiers of trapezoid blocks facing the stage.
    # Audience occupies the north arc (+Y), opposite the stage at -Y.
    tiers = [(24, 4.0), (30, 7.5), (36, 11.0)]
    for t, (radius, z) in enumerate(tiers):
        steps = 26
        for s in range(steps):
            ang = math.radians(18 + s * (144 / (steps - 1)))
            # skip the wedge behind the stage (backline/backstage)
            sx = x + math.cos(ang) * radius
            sy = y + math.sin(ang) * radius
            if sy < y - 20 and abs(sx - x) < 18:
                continue
            block = cube(f"TIER{t}_seat_{s}", (sx, sy, FLOOR_Z + z), (5.6, 3.4, 1.6),
                         mats["seat_dark"] if (s + t) % 7 else mats["seat_blue"], coll, bevel=0.15)
            block.rotation_euler[2] = ang + math.radians(90)

    # Backstage block behind the stage (green room, gear corridor).
    cube("BACKSTAGE_block", (x, y - 44, 5), (30, 10, 10), mats["venue_wall"], coll, bevel=0.4)
    cube("BACKSTAGE_door", (x, y - 38.9, 2.6), (4.4, 0.4, 5.2), mats["green_emit"], coll)
    text_mesh("BACKSTAGE_sign", "ARTISTS ONLY", (x, y - 38.7, 6.2), 0.7, mats["paper_emit"], coll,
              rotation=(math.radians(90), 0, 0), extrude=0.03)

    # Vomitory tunnels (entry moments for crowd-entry camera).
    for side in (-1, 1):
        cube(f"TUNNEL_{side}", (x + side * 30, y + 8, 3.2), (6, 10, 6.4), mats["gunmetal_dark"], coll)
        cube(f"TUNNEL_glow_{side}", (x + side * 30, y + 3, 3.2), (4.6, 0.3, 5.4), mats["lamp"], coll)


# --------------------------------------------------------------------------
# STAGE — deck, thrust, backline, screens, truss, speakers, lasers
# --------------------------------------------------------------------------


def build_stage(mats, coll):
    x = ARENA_X
    sy = STAGE_Y
    # Main deck + thrust into the floor.
    cube("STAGE_deck", (x, sy - 6, 3.0), (34, 14, 2.4), mats["stage_deck"], coll, bevel=0.25)
    cube("STAGE_thrust", (x, sy + 8, 2.6), (10, 16, 1.6), mats["stage_deck"], coll, bevel=0.25)
    cube("STAGE_edge_light", (x, sy + 15.8, 2.7), (10, 0.5, 0.7), mats["signal_emit"], coll)
    # Riser for drums.
    cyl("STAGE_drum_riser", (x, sy - 9, 4.6), 3.6, 1.0, mats["gunmetal"], coll, vertices=20)

    # Drum kit (simplified): kick, snare, toms, cymbals.
    cyl("DRUM_kick", (x, sy - 9, 5.6), 1.0, 1.0, mats["album_red"], coll, vertices=16, rotation=(math.radians(90), 0, 0))
    cyl("DRUM_snare", (x - 1.6, sy - 7.8, 6.0), 0.6, 0.5, mats["chrome"], coll, vertices=14)
    for i, dx in enumerate((-0.9, 0.0, 0.9)):
        cyl(f"DRUM_tom_{i}", (x + dx, sy - 8.6, 6.5), 0.5, 0.6, mats["album_red"], coll, vertices=14)
    for i, dx in enumerate((-2.2, 2.2)):
        cyl(f"DRUM_cym_{i}", (x + dx, sy - 8.2, 7.0), 0.7, 0.06, mats["bridge_gold"], coll, vertices=16)
        cyl(f"DRUM_cymstand_{i}", (x + dx, sy - 8.2, 6.0), 0.05, 2.0, mats["gunmetal"], coll, vertices=6)

    # Amp stacks.
    for side in (-1, 1):
        for row in range(2):
            cube(f"AMP_{side}_{row}", (x + side * 12, sy - 8 - row * 1.6, 5.4), (3.2, 1.4, 4.4), mats["gunmetal_dark"], coll, bevel=0.2)
            cube(f"AMP_{side}_{row}_grille", (x + side * 12, sy - 7.2 - row * 1.6, 5.4), (2.8, 0.1, 4.0), mats["concourse"], coll)

    # Rear LED wall + two side screens (cover art / signal).
    cube("SCREEN_main", (x, sy - 13.4, 11), (30, 0.8, 14), mats["screen_main"], coll)
    for side in (-1, 1):
        scr = cube(f"SCREEN_side_{side}", (x + side * 20, sy - 11, 10), (9, 0.7, 12), mats["screen_side"], coll)
        scr.rotation_euler[2] = math.radians(side * -16)

    # Overhead lighting truss (box grid) + two side towers.
    for dx in (-16, -8, 0, 8, 16):
        cube(f"TRUSS_beam_x_{dx}", (x + dx, sy - 6, 20), (0.6, 16, 0.6), mats["truss"], coll)
    for dy in (-13, -6, 1):
        cube(f"TRUSS_beam_y_{dy}", (x, sy + dy, 20), (34, 0.6, 0.6), mats["truss"], coll)
    for side in (-1, 1):
        cube(f"TRUSS_tower_{side}", (x + side * 18.5, sy - 6, 11), (1.2, 1.2, 18), mats["truss"], coll)
        # Line array hangs.
        for i in range(5):
            cube(f"ARRAY_{side}_{i}", (x + side * 21, sy - 6, 16 - i * 1.9), (2.2, 1.6, 1.6), mats["gunmetal_dark"], coll, bevel=0.2)

    # Spot fixture heads on the truss (named LIGHT_* so the web runtime can
    # attach real spotlights + vary intensity per chapter). Laser bars are
    # added by build_lighting so all emissives stay grouped there.
    heads = []
    for i, dx in enumerate((-14, -9, -4, 4, 9, 14)):
        head = cyl(f"LIGHT_HEAD_{i}", (x + dx, sy - 6, 19.2), 0.5, 1.1, mats["fixture"], coll, vertices=10)
        heads.append(head)
    return heads


# --------------------------------------------------------------------------
# LIGHTING — cue groups per track + beams + lasers
# --------------------------------------------------------------------------


def build_lighting(mats, coll, chapter_colls):
    x = ARENA_X
    sy = STAGE_Y
    # Volumetric-look beams: emissive cones from truss to stage. The web
    # runtime recolors them per chapter via their BEAM_* names.
    beams = []
    for i, dx in enumerate((-14, -9, -4, 4, 9, 14)):
        bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.4, radius2=3.2, depth=15,
                                        location=(x + dx, sy - 6, 11.5))
        beam = bpy.context.object
        beam.name = f"BEAM_{i}"
        beam.data.materials.append(mats["beam"])
        move_to(beam, coll)
        beams.append(beam)

    # Laser fans from the rear towers (thin emissive blades).
    for side in (-1, 1):
        for i in range(4):
            laser = cube(f"LASER_{side}_{i}", (x + side * 18, sy - 2, 14 + i * 1.1),
                         (0.06, 26, 0.06), mats["laser"], coll)
            laser.rotation_euler[0] = math.radians(8 + i * 7)
            laser.rotation_euler[2] = math.radians(side * (10 + i * 5))

    # Real spotlights for the .blend renders (kept in LIGHTING; the glTF
    # exporter writes them as KHR punctual lights for three.js).
    for i, dx in enumerate((-10, 0, 10)):
        data = bpy.data.lights.get(f"SPOT_{i}") or bpy.data.lights.new(f"SPOT_{i}", "SPOT")
        data.energy = 9000
        data.color = (0.35, 0.62, 1.0)
        data.spot_size = math.radians(46)
        data.spot_blend = 0.5
        spot = bpy.data.objects.new(f"SPOT_{i}", data)
        spot.location = (x + dx, sy - 6, 19)
        coll.objects.link(spot)
        look_at(spot, (x + dx * 0.3, sy + 4, 4))

    def area(name, loc, target, energy, size, color, shape="DISK"):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = shape
        data.size = size
        data.color = color
        light = bpy.data.objects.new(name, data)
        light.location = loc
        coll.objects.link(light)
        look_at(light, target)
        return light

    # Stage wash so the deck/backline read in wide shots.
    area("FILL_Stage_A", (x - 12, sy + 2, 22), (x, sy - 4, 4), 1500, 20, (0.45, 0.62, 1.0))
    area("FILL_Stage_B", (x + 12, sy + 2, 22), (x, sy - 4, 4), 1200, 20, (0.55, 0.72, 1.0))
    # Front wash: lights the deck face and the performer from the crowd side.
    area("FILL_Front", (x, sy + 16, 11), (x, sy + 2, 4), 1300, 15, (0.7, 0.8, 1.0))
    # House wash over the bowl (cool paper light so the crowd never crushes).
    area("FILL_House", (x, ARENA_Y + 8, 34), (x, ARENA_Y + 2, 2), 1800, 42, (0.62, 0.72, 0.9))
    # Warm key dedicated to the performer on the thrust.
    area("KEY_Performer", (x + 4, STAGE_Y + 12, 14), (x, STAGE_Y + 4, 7), 1600, 7, (1.0, 0.82, 0.62))
    # Plaza floods so the arrival shot reads the facade.
    area("FILL_Plaza_L", (ARENA_X - 26, ARENA_Y + 58, 12), (ARENA_X, ARENA_Y + 40, 10), 2200, 16, (0.7, 0.85, 1.0))
    area("FILL_Plaza_R", (ARENA_X + 26, ARENA_Y + 58, 12), (ARENA_X, ARENA_Y + 40, 10), 2200, 16, (0.7, 0.85, 1.0))
    # Moonlight over the whole city.
    area("FILL_Moon", (-60, 120, 140), (0, 20, 0), 3600, 220, (0.5, 0.62, 0.9))

    # One empty per track chapter so DMX-style cueing can grow later.
    for ch in CHAPTERS:
        cue = empty(f"CUE_T{ch['track']:02d}_{ch['chapter'].replace(' ', '')}",
                    (x, sy, 22), chapter_colls,
                    props={"track": ch["track"], "title": ch["title"], "chapter": ch["chapter"],
                           "primary": ch["primary"], "secondary": ch["secondary"], "energy": ch["energy"]})
        cue["note"] = "Lighting/crowd cue slot. Final mastered audio drops into this slot."


# --------------------------------------------------------------------------
# CROWD — instanced, varied, clustered
# --------------------------------------------------------------------------


def make_person_proto(name, shirt_mat, skin_mat, pants_mat, hair_mat, pose, coll):
    """A recognizable low-poly person with legs, torso, head, hair and posed arms."""
    parts = []
    for side in (-1, 1):
        parts.append(cyl(f"{name}_leg_{side}", (side * 0.18, 0, 0.48), 0.12, 0.9,
                         pants_mat, coll, vertices=7))
        parts.append(cube(f"{name}_shoe_{side}", (side * 0.18, 0.09, 0.08),
                          (0.24, 0.42, 0.16), mats_ref["gunmetal_dark"], coll, bevel=0.04))

    torso = cube(f"{name}_torso", (0, 0, 1.24), (0.72, 0.42, 1.02), shirt_mat, coll, bevel=0.13)
    parts.append(torso)
    parts.append(cyl(f"{name}_neck", (0, 0, 1.83), 0.10, 0.18, skin_mat, coll, vertices=7))
    parts.append(uv_sphere(f"{name}_head", (0, 0, 2.08), 0.25, skin_mat, coll,
                           segments=10, rings=7, scale=(0.92, 0.88, 1.06)))
    parts.append(uv_sphere(f"{name}_hair", (0, -0.015, 2.23), 0.24, hair_mat, coll,
                           segments=8, rings=5, scale=(0.94, 0.9, 0.55)))

    # Six concert poses: hands up, one arm up, clapping, phone-front, and sways.
    pose_table = [
        ((-18, 18), (1.20, 1.20)),
        ((-48, 12), (1.53, 1.18)),
        ((-12, 48), (1.18, 1.53)),
        ((-42, 42), (1.48, 1.48)),
        ((-64, 64), (1.62, 1.62)),
        ((-28, 58), (1.34, 1.58)),
    ]
    arm_angles, arm_heights = pose_table[pose % len(pose_table)]
    for idx, side in enumerate((-1, 1)):
        angle = math.radians(arm_angles[idx])
        height = arm_heights[idx]
        arm = cyl(f"{name}_arm_{side}", (side * 0.47, 0.02, height), 0.095, 0.92,
                  shirt_mat, coll, vertices=7)
        arm.rotation_euler[1] = angle * side
        parts.append(arm)
        hand = uv_sphere(f"{name}_hand_{side}",
                         (side * (0.47 + abs(math.sin(angle)) * 0.34), 0.02,
                          height + math.cos(angle) * 0.44),
                         0.105, skin_mat, coll, segments=7, rings=5)
        parts.append(hand)

    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = torso
    bpy.ops.object.join()
    torso.name = name
    return torso


def build_crowd(mats, coll):
    global mats_ref
    mats_ref = mats
    x, y = ARENA_X, ARENA_Y
    shirts = [mats["crowd_a"], mats["crowd_b"], mats["crowd_c"], mats["crowd_d"], mats["crowd_e"],
              mats["crowd_f"], mats["crowd_g"], mats["crowd_h"]]
    skins = [mats["skin_a"], mats["skin_b"], mats["skin_c"]]
    pants = [mats["denim"], mats["crowd_pants_a"], mats["crowd_pants_b"]]
    hairs = [mats["hair"], mats["crowd_hair_b"], mats["crowd_hair_c"]]
    # prototype row parked far below the venue; GLB instances share meshes
    protos = []
    for i in range(18):
        proto = make_person_proto(f"PERSON_proto_{i}", shirts[i % len(shirts)],
                                  skins[(i * 5) % len(skins)], pants[(i * 7) % len(pants)],
                                  hairs[(i * 11) % len(hairs)], i % 6, coll)
        proto.location = (0, -200 - i * 2, -30)
        proto.hide_render = True
        proto["pose"] = i % 6
        protos.append(proto)

    members = []
    count_floor = 260 if QUICK else 700
    count_bowl = 420 if QUICK else 1300

    # Floor: dense pack facing the stage, tighter near the barricade.
    for i in range(count_floor):
        ang = random.uniform(0, math.tau)
        r = math.sqrt(random.uniform(0.02, 1.0))
        px = x + math.cos(ang) * r * 19.5
        py = (y - 4) + abs(math.sin(ang)) * r * 17.5  # crowd lives stage-side (north of center)
        if py < y + 2 and abs(px - x) < 6:  # keep the thrust clear
            continue
        inst = bpy.data.objects.new(f"CROWD_Floor_{i:04d}", protos[i % len(protos)].data)
        inst.location = (px, py, FLOOR_Z)
        inst.rotation_euler[2] = math.atan2((y - 30) - py, x - px) - math.radians(90) + random.uniform(-0.2, 0.2)
        s = random.uniform(0.92, 1.08)
        inst.scale = (s, s, random.uniform(0.94, 1.1))
        coll.objects.link(inst)
        inst["phase"] = round(random.uniform(0, math.tau), 3)
        inst["cluster"] = "floor"
        inst["pose"] = i % 6
        members.append(inst)

    # Bowl: mirrored over the tier blocks' radius bands (north arc).
    bowl_tiers = [(24, 4.0), (30, 7.5), (36, 11.0)]
    for i in range(count_bowl):
        tier = i % 3
        radius, z = bowl_tiers[tier]
        ang = math.radians(random.uniform(35, 145))
        px = x + math.cos(ang) * (radius + random.uniform(-1.2, 1.2))
        py = y + math.sin(ang) * (radius + random.uniform(-1.2, 1.2))
        if py < y - 20 and abs(px - x) < 18:
            continue
        inst = bpy.data.objects.new(f"CROWD_Bowl_{i:04d}", protos[(i * 7) % len(protos)].data)
        inst.location = (px, py, FLOOR_Z + z + 0.8)
        inst.rotation_euler[2] = math.atan2((y - 30) - py, x - px) - math.radians(90)
        s = random.uniform(0.9, 1.06)
        inst.scale = (s, s, s)
        coll.objects.link(inst)
        inst["phase"] = round(random.uniform(0, math.tau), 3)
        inst["cluster"] = f"tier{tier}"
        inst["pose"] = (i * 7) % 6
        members.append(inst)

    # Phone lights: ~12% of the floor crowd holds an emissive quad.
    phone_mesh = cube("PHONE_proto", (0, -220, -30), (0.16, 0.03, 0.26), mats["phone"], coll)
    phone_mesh.hide_render = True
    phones = 0
    for inst in members:
        if not inst.name.startswith("CROWD_Floor") or random.random() > 0.12:
            continue
        ph = bpy.data.objects.new(f"PHONE_{phones:04d}", phone_mesh.data)
        ph.location = (inst.location.x + 0.18, inst.location.y, inst.location.z + 2.15)
        ph.rotation_euler = (math.radians(-18), 0, inst.rotation_euler[2])
        coll.objects.link(ph)
        ph["phase"] = inst["phase"]
        phones += 1
    return members


# --------------------------------------------------------------------------
# PERFORMER — stylized IMMOHRTAL likeness (approved refs: black 814 crewneck,
# short dark textured hair, strong brows, mic in hand)
# --------------------------------------------------------------------------


def build_performer(mats, coll):
    x = ARENA_X
    py = STAGE_Y + 4     # downstage edge of the thrust
    base = 3.4           # on the thrust deck
    g = []

    # boots
    for side in (-1, 1):
        g.append(cube(f"PERF_boot_{side}", (x + side * 0.32, py, base + 0.18), (0.5, 0.86, 0.36), mats["gunmetal_dark"], coll, bevel=0.1))
    # legs (dark denim)
    for side in (-1, 1):
        g.append(cyl(f"PERF_leg_{side}", (x + side * 0.3, py, base + 1.05), 0.24, 1.5, mats["denim"], coll, vertices=10))
    # hips + 814 crewneck torso
    g.append(cube("PERF_hips", (x, py, base + 1.86), (1.0, 0.62, 0.5), mats["denim"], coll, bevel=0.14))
    torso = uv_sphere("PERF_torso", (x, py, base + 2.9), 1.0, mats["crewneck"], coll, segments=18, rings=14, scale=(0.82, 0.62, 1.05))
    g.append(torso)
    # crewneck collar
    g.append(cyl("PERF_collar", (x, py, base + 3.86), 0.3, 0.22, mats["gunmetal_dark"], coll, vertices=12))
    # 814 chest print (slightly curved plate sitting on the sweatshirt front)
    plate = cube("PERF_814", (x, py + 0.55, base + 3.05), (1.1, 0.1, 0.62), mats["print_814"], coll, bevel=0.06)
    g.append(plate)
    # head + neck
    g.append(cyl("PERF_neck", (x, py, base + 3.98), 0.2, 0.34, mats["skin"], coll, vertices=10))
    head = uv_sphere("PERF_head", (x, py, base + 4.5), 0.52, mats["skin"], coll, segments=20, rings=16, scale=(0.92, 0.86, 1.06))
    g.append(head)
    # ears, nose hint
    for side in (-1, 1):
        g.append(uv_sphere(f"PERF_ear_{side}", (x + side * 0.47, py - 0.02, base + 4.5), 0.11, mats["skin"], coll, segments=8, rings=6, scale=(0.5, 0.7, 0.9)))
    g.append(uv_sphere("PERF_nose", (x, py + 0.44, base + 4.42), 0.09, mats["skin"], coll, segments=8, rings=6, scale=(0.8, 1.2, 1.0)))
    g.append(cube("PERF_mouth", (x, py + 0.48, base + 4.25), (0.24, 0.055, 0.07), mats["album_red"], coll, bevel=0.025))
    # strong eyebrows (signature from the approved portraits)
    for side in (-1, 1):
        brow = cube(f"PERF_brow_{side}", (x + side * 0.19, py + 0.4, base + 4.68), (0.3, 0.08, 0.07), mats["hair"], coll, bevel=0.03)
        brow.rotation_euler[1] = math.radians(side * -8)
        g.append(brow)
    # short textured hair: flattened cap + noise tufts
    hair = uv_sphere("PERF_hair", (x, py - 0.05, base + 4.72), 0.55, mats["hair"], coll, segments=18, rings=12, scale=(0.94, 0.9, 0.72))
    g.append(hair)
    for i in range(14):
        a = random.uniform(0, math.tau)
        r = random.uniform(0.12, 0.42)
        tuft = uv_sphere(f"PERF_hairtuft_{i}", (x + math.cos(a) * r, py - 0.05 + math.sin(a) * r * 0.85, base + 4.86 + random.uniform(-0.05, 0.12)),
                         random.uniform(0.06, 0.13), mats["hair"], coll, segments=6, rings=4)
        g.append(tuft)
    # eyes (dark, forward)
    for side in (-1, 1):
        g.append(uv_sphere(f"PERF_eye_{side}", (x + side * 0.18, py + 0.42, base + 4.52), 0.055, mats["gunmetal_dark"], coll, segments=8, rings=6))
    # arms: right arm raised with mic, left relaxed
    upper_r = cyl("PERF_upperarm_R", (x + 0.78, py + 0.1, base + 3.7), 0.17, 1.0, mats["crewneck"], coll, vertices=10)
    upper_r.rotation_euler = (math.radians(-30), math.radians(-58), 0)
    g.append(upper_r)
    fore_r = cyl("PERF_forearm_R", (x + 1.05, py + 0.5, base + 4.55), 0.14, 0.9, mats["crewneck"], coll, vertices=10)
    fore_r.rotation_euler = (math.radians(-20), math.radians(-18), 0)
    g.append(fore_r)
    g.append(uv_sphere("PERF_hand_R", (x + 1.1, py + 0.72, base + 5.0), 0.16, mats["skin"], coll, segments=10, rings=8))
    mic = cyl("PERF_mic", (x + 1.12, py + 0.8, base + 5.3), 0.07, 0.5, mats["gunmetal_dark"], coll, vertices=10)
    mic.rotation_euler = (math.radians(-25), 0, 0)
    g.append(mic)
    g.append(uv_sphere("PERF_mic_head", (x + 1.12, py + 0.93, base + 5.52), 0.12, mats["chrome"], coll, segments=10, rings=8))
    upper_l = cyl("PERF_upperarm_L", (x - 0.72, py - 0.05, base + 3.1), 0.17, 1.0, mats["crewneck"], coll, vertices=10)
    upper_l.rotation_euler = (0, math.radians(24), math.radians(12))
    g.append(upper_l)
    fore_l = cyl("PERF_forearm_L", (x - 0.95, py + 0.25, base + 2.4), 0.14, 0.85, mats["crewneck"], coll, vertices=10)
    fore_l.rotation_euler = (math.radians(-40), math.radians(10), 0)
    g.append(fore_l)
    g.append(uv_sphere("PERF_hand_L", (x - 0.98, py + 0.5, base + 1.98), 0.16, mats["skin"], coll, segments=10, rings=8))

    # Group under one root so the web runtime can address the whole figure.
    # matrix_parent_inverse keeps each part's world transform intact (a bare
    # `obj.parent = root` would teleport everything by the root's offset).
    root = empty("PERFORMER_IMMOHRTAL", (x, py, base), coll, props={"role": "performer", "ref": "approved artist imagery: black 814 crewneck, short dark hair, strong brows"})
    root_inv = root.matrix_world.inverted()
    for obj in g:
        obj.parent = root
        obj.matrix_parent_inverse = root_inv
    return root


# --------------------------------------------------------------------------
# CAMERAS — named shots required by the brief
# --------------------------------------------------------------------------

CAMERA_SPECS = [
    # name, location, look target, lens
    ("CAM_Exterior_Arrival", (0, 82, 16), (-4, 26, 17), 32),
    ("CAM_Crowd_Entry", (-30, 8, 3.4), (0, -12, 4), 24),
    ("CAM_FOH", (0, 28, 13), (0, -28, 7), 32),
    ("CAM_Pit", (3.5, -16, 2.4), (0, -30, 5), 28),
    ("CAM_Stage", (-12, -20, 6), (4, -30, 6), 40),
    ("CAM_Performer_CloseUp", (2.6, -13, 6.2), (0, -22.4, 6.6), 52),
    ("CAM_Aerial_Pittsburgh", (-95, 95, 70), (-10, 10, 0), 32),
    ("CAM_Finale", (24, 26, 14), (0, -28, 8), 26),
]


def build_cameras(coll):
    for name, loc, target, lens in CAMERA_SPECS:
        data = bpy.data.cameras.new(name)
        data.lens = lens
        data.dof.use_dof = False
        cam = bpy.data.objects.new(name, data)
        cam.location = loc
        coll.objects.link(cam)
        look_at(cam, target)
    bpy.context.scene.camera = bpy.data.objects["CAM_Exterior_Arrival"]


# --------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------


def build_materials():
    m = {}
    m["paper"] = mat_principled("MAT_Paper", PAPER, roughness=0.85)
    m["ground"] = mat_principled("MAT_Ground", (0.10, 0.11, 0.13, 1), roughness=0.95)
    m["plaza"] = mat_principled("MAT_Plaza", (0.16, 0.17, 0.19, 1), roughness=0.9)
    m["gunmetal"] = mat_principled("MAT_Gunmetal", GUNMETAL, metallic=0.85, roughness=0.35)
    m["gunmetal_dark"] = mat_principled("MAT_GunmetalDark", GUNMETAL_DARK, metallic=0.7, roughness=0.4)
    m["chrome"] = mat_principled("MAT_Chrome", CHROME, metallic=1.0, roughness=0.18)
    m["truss"] = mat_principled("MAT_Truss", (0.13, 0.15, 0.18, 1), metallic=0.8, roughness=0.4)
    m["fixture"] = mat_principled("MAT_Fixture", (0.07, 0.08, 0.1, 1), metallic=0.6, roughness=0.5)
    m["venue_wall"] = mat_principled("MAT_VenueWall", (0.12, 0.13, 0.16, 1), roughness=0.8)
    m["concourse"] = mat_principled("MAT_Concourse", (0.2, 0.21, 0.24, 1), roughness=0.85)
    m["floor"] = mat_principled("MAT_Floor", (0.09, 0.09, 0.11, 1), roughness=0.6)
    m["stage_deck"] = mat_principled("MAT_StageDeck", (0.11, 0.12, 0.14, 1), roughness=0.5)
    m["seat_dark"] = mat_principled("MAT_SeatDark", (0.10, 0.11, 0.14, 1), roughness=0.8)
    m["seat_blue"] = mat_principled("MAT_SeatBlue", SIGNAL_DEEP, roughness=0.7)
    m["tower_dark"] = mat_principled("MAT_TowerDark", (0.07, 0.08, 0.11, 1), metallic=0.4, roughness=0.5)
    m["tower_glass"] = mat_principled("MAT_TowerGlass", (0.10, 0.16, 0.24, 1), metallic=0.9, roughness=0.22)
    m["tower_mid"] = mat_principled("MAT_TowerMid", (0.13, 0.14, 0.18, 1), roughness=0.6)
    m["hill"] = mat_principled("MAT_Hill", (0.05, 0.09, 0.08, 1), roughness=1.0)
    m["river"] = mat_principled("MAT_River", RIVER, metallic=0.3, roughness=0.25)
    m["bridge_gold"] = mat_principled("MAT_PGHGold", PGH_GOLD, metallic=0.35, roughness=0.45)
    m["denim"] = mat_principled("MAT_Denim", (0.08, 0.10, 0.15, 1), roughness=0.9)
    m["crewneck"] = mat_principled("MAT_CrewneckBlack", (0.03, 0.03, 0.035, 1), roughness=0.92)
    m["print_814"] = mat_principled("MAT_814Print", (0.85, 0.85, 0.83, 1), roughness=0.7)
    m["skin"] = mat_principled("MAT_Skin", SKIN, roughness=0.55)
    m["hair"] = mat_principled("MAT_Hair", HAIR, roughness=0.6)
    m["album_red"] = mat_principled("MAT_AlbumRed", ALBUM_RED, roughness=0.5)
    # emissive / fx
    m["windows"] = mat_emissive("MAT_Windows", (0.85, 0.92, 1.0, 1), 3.2)
    m["lamp"] = mat_emissive("MAT_StreetLamp", (1.0, 0.85, 0.55, 1), 7.0)
    m["moon"] = mat_emissive("MAT_Moon", (0.9, 0.95, 1.0, 1), 3.0)
    m["signal_emit"] = mat_emissive("MAT_SignalEmit", SIGNAL, 4.5)
    m["green_emit"] = mat_emissive("MAT_GreenEmit", GREEN, 3.6)
    m["paper_emit"] = mat_emissive("MAT_PaperEmit", PAPER, 2.4)
    m["beam"] = mat_emissive("MAT_BeamSignal", SIGNAL, 2.8)
    m["laser"] = mat_emissive("MAT_Laser", GREEN, 9.0)
    m["phone"] = mat_emissive("MAT_PhoneScreen", (0.85, 0.93, 1.0, 1), 7.0)
    m["screen_main"] = mat_principled("MAT_ScreenMain", (0.04, 0.05, 0.08, 1), emission=ALBUM_BLUE, emission_strength=3.0)
    m["screen_side"] = mat_principled("MAT_ScreenSide", (0.04, 0.05, 0.08, 1), emission=SIGNAL, emission_strength=2.6)
    m["sky"] = mat_principled("MAT_Sky", NIGHT, roughness=1.0)
    m["sky"].use_nodes = True
    sky_bsdf = m["sky"].node_tree.nodes.get("Principled BSDF")
    sky_bsdf.inputs["Emission Color"].default_value = (0.03, 0.05, 0.12, 1)
    sky_bsdf.inputs["Emission Strength"].default_value = 0.35
    # crowd variants
    m["crowd_a"] = mat_principled("MAT_CrowdA", (0.10, 0.11, 0.14, 1), roughness=0.9)
    m["crowd_b"] = mat_principled("MAT_CrowdB", (0.16, 0.18, 0.22, 1), roughness=0.9)
    m["crowd_c"] = mat_principled("MAT_CrowdC", (0.12, 0.20, 0.28, 1), roughness=0.9)
    m["crowd_d"] = mat_principled("MAT_CrowdD", (0.22, 0.14, 0.12, 1), roughness=0.9)
    m["crowd_e"] = mat_principled("MAT_CrowdE", (0.09, 0.16, 0.12, 1), roughness=0.9)
    m["crowd_f"] = mat_principled("MAT_CrowdF", (0.48, 0.10, 0.13, 1), roughness=0.86)
    m["crowd_g"] = mat_principled("MAT_CrowdG", (0.78, 0.48, 0.08, 1), roughness=0.86)
    m["crowd_h"] = mat_principled("MAT_CrowdH", (0.34, 0.12, 0.48, 1), roughness=0.86)
    m["crowd_pants_a"] = mat_principled("MAT_CrowdPantsA", (0.16, 0.17, 0.20, 1), roughness=0.9)
    m["crowd_pants_b"] = mat_principled("MAT_CrowdPantsB", (0.16, 0.12, 0.08, 1), roughness=0.9)
    m["crowd_hair_b"] = mat_principled("MAT_CrowdHairB", (0.10, 0.055, 0.025, 1), roughness=0.68)
    m["crowd_hair_c"] = mat_principled("MAT_CrowdHairC", (0.34, 0.20, 0.08, 1), roughness=0.68)
    m["skin_a"] = mat_principled("MAT_SkinA", (0.78, 0.60, 0.48, 1), roughness=0.6)
    m["skin_b"] = mat_principled("MAT_SkinB", (0.55, 0.38, 0.28, 1), roughness=0.6)
    m["skin_c"] = mat_principled("MAT_SkinC", (0.90, 0.72, 0.58, 1), roughness=0.6)
    return m


# --------------------------------------------------------------------------
# Build / export / render
# --------------------------------------------------------------------------


def build_scene():
    reset_scene()
    mats = build_materials()

    root = collection("IMMOHRTAL_CONCERT")
    city = collection("CITY", root)
    v_ext = collection("VENUE_EXT", root)
    v_int = collection("VENUE_INT", root)
    stage = collection("STAGE", root)
    lighting = collection("LIGHTING", root)
    cues = collection("CUES", lighting)
    crowd = collection("CROWD", root)
    performer = collection("PERFORMER", root)
    cameras = collection("CAMERAS", root)

    build_city(mats, city)
    build_venue_ext(mats, v_ext)
    build_venue_int(mats, v_int)
    heads = build_stage(mats, stage)
    for head in heads:  # spot fixtures live with lighting
        move_to(head, lighting)
    build_lighting(mats, lighting, cues)
    members = build_crowd(mats, crowd)
    build_performer(mats, performer)
    build_cameras(cameras)

    # Machine-readable cue sheet for the web runtime.
    sheet = empty("CUE_SHEET", (0, 0, 0), cues)
    sheet["chapters"] = json.dumps(CHAPTERS)
    sheet["format"] = "immohrtal-concert-cues/v1"

    # World: night exterior.
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (0.02, 0.035, 0.08, 1)
    bg.inputs["Strength"].default_value = 0.55

    print(f"[build_scene] crowd members: {len(members)}")
    print(f"[build_scene] objects: {len(bpy.data.objects)}")
    return root


def save_blend():
    os.makedirs(os.path.dirname(BLEND_PATH), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[build_scene] saved {BLEND_PATH}")


def export_glb():
    os.makedirs(os.path.dirname(GLB_PATH), exist_ok=True)
    # Hide prototype rows from export (they are parked below the venue but
    # keep the file honest).
    for obj in bpy.data.objects:
        if obj.name.startswith("PERSON_proto") or obj.name.startswith("PHONE_proto"):
            obj.hide_set(True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format="GLB",
        export_apply=True,
        export_extras=True,
        export_cameras=True,
        export_lights=True,
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_yup=True,
    )
    size_mb = os.path.getsize(GLB_PATH) / (1024 * 1024)
    print(f"[build_scene] exported {GLB_PATH} ({size_mb:.2f} MB)")
    for obj in bpy.data.objects:
        if obj.name.startswith("PERSON_proto") or obj.name.startswith("PHONE_proto"):
            obj.hide_set(False)


def setup_render():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 32 if QUICK else 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 960 if QUICK else 1280
    scene.render.resolution_y = 540 if QUICK else 720
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 88
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.35


def render_previews():
    setup_render()
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    shots = [
        ("preview-exterior-arrival", "CAM_Exterior_Arrival"),
        ("preview-foh-stage", "CAM_FOH"),
        ("preview-performer-closeup", "CAM_Performer_CloseUp"),
        ("preview-aerial-pittsburgh", "CAM_Aerial_Pittsburgh"),
    ]
    for filename, cam_name in shots:
        cam = bpy.data.objects.get(cam_name)
        if not cam:
            continue
        bpy.context.scene.camera = cam
        bpy.context.scene.render.filepath = os.path.join(PREVIEW_DIR, f"{filename}.jpg")
        bpy.ops.render.render(write_still=True)
        print(f"[build_scene] rendered {filename}")
    # web poster from the FOH shot
    bpy.context.scene.camera = bpy.data.objects["CAM_FOH"]
    bpy.context.scene.render.filepath = POSTER_PATH
    bpy.ops.render.render(write_still=True)
    print(f"[build_scene] poster {POSTER_PATH}")


def main():
    print(f"[build_scene] QUICK={QUICK} EXPORT={DO_EXPORT} RENDER={DO_RENDER} SAVE={DO_SAVE}")
    build_scene()
    if DO_SAVE:
        save_blend()
    if DO_EXPORT:
        export_glb()
    if DO_RENDER:
        render_previews()
    print("[build_scene] done")


if __name__ == "__main__":
    main()
