# LEGO Procedural Planner

## Overview

This project is the beginning of a procedural LEGO construction system.

The long-term goal is to allow a user to describe a LEGO model in
natural language, such as:

> "Build me a small cube."

The system will eventually translate that request into a structured
build description, have a LEGO construction algorithm decide which LEGO
pieces to use and where to put them, and then export the finished model
as an LDraw `.ldr` file.

The current project focuses on the **LEGO construction/planning stage**.

``` text
Future:
User text
   ↓
AI / text parser
   ↓
Structured build description
   ↓
LEGO planner
   ↓
LDraw exporter
   ↓
.ldr model
```

At the moment, the AI/text-parser stage does not exist yet. We are
developing the LEGO planner first.

------------------------------------------------------------------------

# Current Version

The current planner can:

-   Represent a LEGO building area as a 3D grid.
-   Define multiple LEGO brick types.
-   Check whether a brick fits inside the building area.
-   Detect collisions with already placed bricks.
-   Check whether a brick is supported.
-   Find the next empty position automatically.
-   Find which available brick types can fit at that position.
-   Choose a brick according to a simple strategy.
-   Place the selected brick into the model.
-   Repeat until the requested space is filled.
-   Export the resulting model to an LDraw `.ldr` file.

The current selection strategy is intentionally simple:

> Try larger bricks first and use the first brick that fits.

This is a **greedy algorithm**. It is useful as a first step, but it is
not yet a complete LEGO construction algorithm.

------------------------------------------------------------------------

# 1. The Original Hardcoded Version

The first version was designed to prove that we could represent a LEGO
model in Python and export it to LDraw.

It only knew about one brick:

``` python
BRICK_2X2 = Brick(
    "2x2 brick",
    2,
    2,
    1,
    "3003.dat"
)
```

The cube-building function explicitly told the program where every brick
should go:

``` python
def build_cube(width, height, depth):
    model = LegoGrid(width, height, depth)

    for y in range(height):
        for z in range(0, depth, BRICK_2X2.depth):
            for x in range(0, width, BRICK_2X2.width):
                model.place(
                    BRICK_2X2,
                    x,
                    y,
                    z
                )

    return model
```

The program therefore already knew:

-   Which brick to use.
-   How many bricks were needed.
-   Where each brick should be placed.

It was generating a predetermined pattern rather than solving a LEGO
construction problem.

------------------------------------------------------------------------

# 2. The New Version

The new version separates:

> "What pieces are available?"

from:

> "Where should the next piece go?"

The program now has a LEGO parts catalog:

``` python
BRICKS = [
    BRICK_2X4,
    BRICK_2X2,
    BRICK_1X2,
    BRICK_1X1,
]
```

The planner can examine this catalog and decide which piece can be used.

Instead of:

``` text
Use a 2×2 brick here.
```

the program now does:

``` text
Find empty position.
        ↓
What bricks can fit?
        ↓
2×4?
2×2?
1×2?
1×1?
        ↓
Choose one.
        ↓
Place it.
```

This is the first major transition from a **hardcoded model generator**
to a **procedural LEGO planner**.

------------------------------------------------------------------------

# 3. LEGO Brick Representation

Each brick is represented by the `Brick` dataclass:

``` python
@dataclass(frozen=True)
class Brick:
    name: str
    width: int
    depth: int
    height: int
    ldraw_part: str
```

For example:

``` python
BRICK_2X4 = Brick(
    "2x4 brick",
    4,
    2,
    1,
    "3001.dat"
)
```

The planner considers this brick to occupy:

-   4 studs wide
-   2 studs deep
-   1 brick high

and LDraw uses `3001.dat` for the corresponding part.

The orientation matters. The planner's `width` and `depth` need to match
the orientation used when the part is exported to LDraw.

------------------------------------------------------------------------

# 4. Brick Placement

A `Brick` describes a type of piece.

A `Placement` describes one actual instance of that piece inside the
model:

``` python
@dataclass(frozen=True)
class Placement:
    brick: Brick
    x: int
    y: int
    z: int
```

For example:

``` python
Placement(
    BRICK_2X4,
    0,
    1,
    2
)
```

means:

> Use a 2×4 brick at X=0, Y=1, Z=2.

The same brick type can therefore be used many times at different
locations.

------------------------------------------------------------------------

# 5. The 3D LEGO Grid

The `LegoGrid` class represents the model being constructed:

``` python
model = LegoGrid(
    width,
    height,
    depth
)
```

The grid is a 3D array. Each location is either:

``` python
None
```

meaning empty, or it contains a `Placement` object.

Conceptually:

``` text
       Y
       ↑
       |
       |
       +------→ X
      /
     /
    Z
```

The grid lets the planner answer:

> Is this position already occupied?

This is the foundation of collision detection.

------------------------------------------------------------------------

# 6. Collision Detection

The `can_place()` method checks whether a brick can occupy a position.

It checks:

1.  Negative coordinates.
2.  Model boundaries.
3.  Existing bricks.

For example:

``` python
if x + brick.width > self.width:
    return False
```

prevents a brick from extending outside the building area.

Then the method checks every grid cell that the brick would occupy:

``` python
for dx in range(brick.width):
    for dy in range(brick.height):
        for dz in range(brick.depth):
```

If one is already occupied:

``` python
if self.grid[x + dx][y + dy][z + dz] is not None:
    return False
```

the placement is rejected.

------------------------------------------------------------------------

# 7. Support Detection

The `has_support()` method prevents the planner from placing unsupported
bricks.

If a brick is on the ground:

``` python
if y == 0:
    return True
```

it is supported.

Otherwise, the planner checks the cells underneath the brick.

This is a simplified support rule. Real LEGO construction will
eventually need more sophisticated stud-level connectivity and
structural reasoning.

------------------------------------------------------------------------

# 8. Placing a Brick

The `place()` method combines the checks.

It first asks:

``` text
Can the brick fit?
```

Then:

``` text
Is it supported?
```

Only if both answers are yes does it place the brick.

It then marks all grid cells occupied by that brick and adds the
placement to:

``` python
self.placements
```

The `placements` list becomes the complete list of bricks in the
generated model.

------------------------------------------------------------------------

# 9. Finding an Empty Position

The hardcoded version did not need to find empty locations because
`build_cube()` already knew every location.

The new version has:

``` python
def find_empty_position(self):
```

This searches the grid until it finds the next empty cell.

The planner therefore does not need to be told where the next brick
belongs.

------------------------------------------------------------------------

# 10. Finding Candidate Bricks

Once an empty position is found, the planner asks:

``` python
def get_candidates(self, x, y, z):
```

This tests every brick in the catalog.

For example:

``` text
Position:
(0, 0, 0)

Test:
2×4 → fits
2×2 → fits
1×2 → fits
1×1 → fits
```

The result is a list of valid candidates.

This is the first point where the program is actually making a
construction decision.

------------------------------------------------------------------------

# 11. Choosing a Brick

The catalog is ordered from larger pieces to smaller pieces:

``` python
BRICKS = [
    BRICK_2X4,
    BRICK_2X2,
    BRICK_1X2,
    BRICK_1X1,
]
```

The planner chooses:

``` python
chosen_brick = candidates[0]
```

Therefore, if multiple pieces fit, it tries the larger piece first.

This is a **greedy strategy**: it makes a local choice without looking
far into the future.

------------------------------------------------------------------------

# 12. The New `fill_space()` Algorithm

The central new function is:

``` python
def fill_space(model):
```

Its logic is:

``` text
WHILE there is empty space:

    Find the next empty position.

    Find all bricks that can fit there.

    Choose one of the candidates.

    Place the brick.

REPEAT
```

In pseudocode:

``` text
while model is not full:

    position = find_empty_position()

    candidates = get_candidates(position)

    chosen = candidates[0]

    place(chosen)
```

This is the core of the new procedural system.

------------------------------------------------------------------------

# 13. What Changed Between Versions

## Hardcoded Version

``` text
Program
    ↓
build_cube()
    ↓
Explicitly choose 2×2
    ↓
Explicitly calculate position
    ↓
Place brick
    ↓
Repeat
    ↓
LDraw
```

The program already knew the solution.

## New Version

``` text
Program
    ↓
Create empty building area
    ↓
Find empty location
    ↓
Look at available bricks
    ↓
Determine which pieces fit
    ↓
Choose a piece
    ↓
Place it
    ↓
Find another empty location
    ↓
Repeat
    ↓
LDraw
```

The program now has to make construction decisions.

------------------------------------------------------------------------

# 14. LDraw Export

The planner's internal representation is separate from LDraw.

The planner thinks in LEGO-oriented grid coordinates.

The exporter converts those coordinates into LDraw coordinates.

For example:

``` python
x = (
    placement.x +
    brick.width / 2
) * 20
```

converts the planner's X position into an LDraw position.

The vertical coordinate is converted with:

``` python
y = -placement.y * 24
```

and depth is converted with:

``` python
z = (
    placement.z +
    brick.depth / 2
) * 20
```

This separation is important because the planner should not have to
understand every detail of LDraw's file format.

------------------------------------------------------------------------

# 15. Why the Coordinate System Needed Attention

During development, we found that the Python planner could report no
collisions while the resulting LDraw model visually contained
overlapping bricks.

This can happen because there are two separate systems:

``` text
Python planner coordinates
        ↓
    conversion
        ↓
LDraw coordinates
```

The planner can be internally correct while the conversion to LDraw is
incorrect.

This is why the project separates:

1.  LEGO geometry
2.  LEGO planning
3.  LDraw representation

As more LEGO pieces are added, this separation will become increasingly
important.

------------------------------------------------------------------------

# 16. Current Limitations

### Greedy brick selection

It currently chooses the first fitting brick. It does not look ahead to
determine whether that choice will make the rest of the model difficult.

### Limited brick catalog

We currently only have:

``` text
1×1
1×2
2×2
2×4
```

A real system will eventually need many more parts.

### Limited rotations

The current implementation does not yet allow the planner to freely
rotate a brick and test every orientation.

A 2×4 should eventually be able to become a 4×2 when that orientation
fits better.

### Simplified support

The current support system requires the brick to be fully supported
underneath. Real LEGO structures can bridge gaps and connect through
individual studs.

### No stud-level connectivity

The planner currently treats bricks as rectangular volumes. It does not
yet reason about studs, tubes, or actual clutch connections.

### No AI input yet

The program does not yet understand natural language.

Eventually:

``` text
"Make an 8×8 platform"
```

could become:

``` json
{
    "type": "platform",
    "width": 8,
    "depth": 8,
    "height": 1
}
```

and the LEGO planner would construct it.

------------------------------------------------------------------------

# 17. Planned Development

## Stage 1 --- Current

``` text
Multiple bricks
    ↓
Fit checking
    ↓
Collision detection
    ↓
Support
    ↓
Greedy selection
    ↓
LDraw
```

## Stage 2 --- Rotation

Allow bricks to be placed in different orientations.

For example:

``` text
2×4
```

could be placed as either:

``` text
4 × 2
```

or:

``` text
2 × 4
```

depending on the available space.

## Stage 3 --- Better selection

Instead of:

``` python
chosen_brick = candidates[0]
```

evaluate candidates using a score based on factors such as:

-   Space filled.
-   Awkward holes left behind.
-   Number of pieces.
-   Structural support.
-   Symmetry.
-   Future placement possibilities.

## Stage 4 --- Search and backtracking

Instead of immediately committing to the first choice:

``` text
Try brick A
    ↓
Does the rest work?
    ↓
No
    ↓
Undo A
    ↓
Try brick B
```

The planner can recover from bad early decisions.

## Stage 5 --- Stud-level LEGO geometry

Move from simple volume occupancy toward actual LEGO connections.

## Stage 6 --- Components

Construct larger models from components:

``` text
Castle
├── Tower
├── Tower
├── Wall
├── Gate
└── Roof
```

## Stage 7 --- Natural-language input

Eventually:

``` text
User:
"Build me a small castle with two towers."
        ↓
AI
        ↓
Structured model description
        ↓
LEGO planner
        ↓
Search / constraints
        ↓
LDraw
```

The AI should primarily interpret the user's request, while
deterministic code handles geometry, collisions, support, connectivity,
and search.

------------------------------------------------------------------------

# 18. Project Architecture

The eventual project could look like:

``` text
lego-project/
│
├── planner.py
├── bricks.py
├── geometry.py
├── search.py
├── ldraw.py
├── parser.py
│
├── parts/
│   ├── 3001.dat
│   ├── 3003.dat
│   ├── 3004.dat
│   └── 3005.dat
│
└── models/
    └── generated_model.ldr
```

The current prototype keeps most responsibilities in one Python file so
that the concepts are easier to learn.

As the project grows, these responsibilities can be separated.

------------------------------------------------------------------------

# 19. Most Important Architectural Concept

The AI should not directly place LEGO bricks.

Instead:

``` text
AI:
"What does the user want?"

LEGO planner:
"How can I construct it?"

Validator:
"Is this construction valid?"

LDraw exporter:
"How do I represent it in an LDraw file?"
```

This separation allows the AI to focus on interpreting language while
deterministic code handles geometry, collisions, support, connectivity,
and eventually search.

------------------------------------------------------------------------

# 20. Current Status

The project has progressed from:

``` text
Hardcoded cube
```

to:

``` text
Procedural LEGO filling
```

The major new capability is that the program can now **select a LEGO
piece based on the state of the model**, rather than simply being told
which piece to put at every location.

The next major technical improvement should be **rotation-aware
placement**, followed by a better candidate-selection/search system.

Ultimately, the goal is to turn this small procedural planner into the
construction engine behind a natural-language-to-LEGO application.
