from dataclasses import dataclass
from pathlib import Path


# ============================================================
# 1. LEGO BRICK DEFINITIONS
# ============================================================

@dataclass(frozen=True)
class Brick:
    name: str
    width: int
    depth: int
    height: int
    ldraw_part: str


# Our available LEGO bricks
BRICK_1X1 = Brick(
    "1x1 brick",
    1,
    1,
    1,
    "3005.dat"
)

BRICK_1X2 = Brick(
    "1x2 brick",
    2,
    1,
    1,
    "3004.dat"
)

BRICK_2X2 = Brick(
    "2x2 brick",
    2,
    2,
    1,
    "3003.dat"
)

BRICK_2X4 = Brick(
    "2x4 brick",
    4,
    2,
    1,
    "3001.dat"
)


# Try larger bricks first.
BRICKS = [
     BRICK_2X4,
  #  BRICK_2X2,
    BRICK_1X2,
    BRICK_1X1,
]


# ============================================================
# 2. BRICK PLACEMENT AND CANIDATE
# ============================================================

@dataclass(frozen=True)
class Placement:
    brick: Brick
    x: int
    y: int
    z: int
    rotation: int = 0


@dataclass(frozen=True)
class Candidate:
    brick: Brick
    rotation: int


# ============================================================
# 3. ROTATION MATRIX (Y-AXIS)
# ============================================================

def get_rotation_matrix(rotation):
    rotations = {
        0: (
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ),

        90: (
            0, 0, -1,
            0, 1, 0,
            1, 0, 0
        ),

        180: (
            -1, 0, 0,
            0, 1, 0,
            0, 0, -1
        ),

        270: (
            0, 0, 1,
            0, 1, 0,
            -1, 0, 0
        ),
    }

    if rotation not in rotations:
        raise ValueError(f"Invalid rotation: {rotation}")

    return rotations[rotation]

# ============================================================
# 4. LEGO GRID
# ============================================================

class LegoGrid:

    def __init__(self, width, height, depth):

        self.width = width
        self.height = height
        self.depth = depth

        # 3D grid.
        #
        # None = empty
        # Placement object = occupied
        #
        self.grid = [
            [
                [None for _ in range(depth)]
                for _ in range(height)
            ]
            for _ in range(width)
        ]

        # Keep a list of every brick we successfully placed.
        self.placements = []


    # --------------------------------------------------------
    # Can this brick physically fit?
    # --------------------------------------------------------

    def can_place(self, brick, x, y, z, rotation=0):

        width, depth = self.get_dimensions(brick, rotation)

        # Don't allow negative coordinates.
        if x < 0 or y < 0 or z < 0:
            return False

        # Make sure the brick stays inside the model.
        if x + width > self.width:
            return False

        if y + brick.height > self.height:
            return False

        if z + depth > self.depth:
            return False

        # Check every grid cell occupied by the brick.
        for dx in range(width):
            for dy in range(brick.height):
                for dz in range(depth):

                    if self.grid[
                        x + dx
                    ][
                        y + dy
                    ][
                        z + dz
                    ] is not None:

                        # Something is already here.
                        return False

        return True


    # --------------------------------------------------------
    # Does the brick have support?
    # --------------------------------------------------------

    def has_support(self, brick, x, y, z, rotation=0):

        # Ground supports the brick.
        if y == 0:
            return True

        width, depth = self.get_dimensions(brick, rotation)

        # Check every position underneath the brick.
        for dx in range(width):
            for dz in range(depth):

                if self.grid[
                    x + dx
                ][
                    y - 1
                ][
                    z + dz
                ] is None:

                    # There is empty space underneath.
                    return False

        return True


    # --------------------------------------------------------
    # Place a brick
    # --------------------------------------------------------

    def place(self, brick, x, y, z, rotation=0):

        # First make sure it fits.
        if not self.can_place(brick, x, y, z, rotation):
            raise ValueError(
                f"{brick.name} cannot be placed at "
                f"({x}, {y}, {z})"
            )

        # Then make sure it is supported.
        if not self.has_support(brick, x, y, z, rotation):
            raise ValueError(
                f"{brick.name} is not supported at "
                f"({x}, {y}, {z})"
            )

        # Create a record of this placement.
        placement = Placement(
            brick,
            x,
            y,
            z,
            rotation=rotation,
        )

        width, depth = self.get_dimensions(brick, rotation)

        # Mark every grid cell occupied by the brick.
        for dx in range(width):
            for dy in range(brick.height):
                for dz in range(depth):

                    self.grid[
                        x + dx
                    ][
                        y + dy
                    ][
                        z + dz
                    ] = placement

        # Remember the brick.
        self.placements.append(placement)

        return placement


    # --------------------------------------------------------
    # Find the next empty position
    # --------------------------------------------------------

    def find_empty_position(self):

        # Search from bottom to top.
        for y in range(self.height):

            # Search through depth.
            for z in range(self.depth):

                # Search from left to right.
                for x in range(self.width):

                    if self.grid[x][y][z] is None:

                        return x, y, z

        # No empty spaces remain.
        return None


    # --------------------------------------------------------
    # Helps with rotation of bricks
    # --------------------------------------------------------

    def get_dimensions(self, brick, rotation):
        if rotation in (0, 180):
            return brick.width, brick.depth

        if rotation in (90, 270):
            return brick.depth, brick.width

        raise ValueError(f"Invalid rotation: {rotation}")

    # --------------------------------------------------------
    # Find every brick that can fit at a position
    # --------------------------------------------------------

    def get_candidates(self, x, y, z):

        candidates = []

        for brick in BRICKS:
            for rotation in (0, 90, 180, 270):
                if self.can_place(brick, x, y, z):

                    if self.has_support(
                        brick,
                        x,
                        y,
                        z,
                        rotation,
                    ):
                        candidates.append(
                            Candidate(
                                brick=brick, 
                                rotation=rotation,
                                )
                            )

        return candidates


    # --------------------------------------------------------
    # Print the model layer-by-layer
    # --------------------------------------------------------

    def print_layers(self):

        for y in range(self.height):

            print()
            print(f"Layer Y={y}")

            print(
                "+" +
                "-" * self.width +
                "+"
            )

            for z in range(self.depth):

                row = ""

                for x in range(self.width):

                    if self.grid[x][y][z] is None:
                        row += "."
                    else:
                        row += "#"

                print("|" + row + "|")

            print(
                "+" +
                "-" * self.width +
                "+"
            )


# ============================================================
# 5. AUTOMATIC LEGO PLANNER
# ============================================================

def fill_space(model):

    while True:

        # Find the next empty location.
        position = model.find_empty_position()

        # If there are no empty locations,
        # we're finished.
        if position is None:
            break

        x, y, z = position

        print(
            f"\nEmpty position found: "
            f"({x}, {y}, {z})"
        )

        # Find all bricks that can go here.
        candidates = model.get_candidates(
            x,
            y,
            z
        )

        if not candidates:

            raise ValueError(
                f"No brick can fit at "
                f"({x}, {y}, {z})"
            )

        print("Possible bricks:")

        for brick in candidates:
            print(
                f"  - {brick.name}"
            )

        # Because BRICKS is ordered from
        # largest to smallest, the first
        # candidate is our preferred brick.
        chosen_brick = candidates[0]

        print(
            f"Choosing: "
            f"{chosen_brick.name}"
        )

        # Place it.
        model.place(
            chosen_brick,
            x,
            y,
            z
        )


# ============================================================
# 6. EXPORT TO LDRAW
# ============================================================

def grid_to_ldraw_position(placement):

    brick = placement.brick

    x = (
        placement.x +
        brick.width / 2
    ) * 20

    y = -placement.y * 24

    z = (
        placement.z +
        brick.depth / 2
    ) * 20

    return x, y, z

def export_ldraw(
    model,
    filename,
    color=4
):

    lines = [
        "0 LEGO model generated by Python",
        (
            f"0 Size: "
            f"{model.width} x "
            f"{model.height} x "
            f"{model.depth}"
        ),
        "0 !LDRAW_ORG Model",
    ]

    for placement in model.placements:

        brick = placement.brick

        # Convert our grid coordinates
        # into LDraw units.
        x, y, z = grid_to_ldraw_position(placement)

        # Get LDraw rotation matrix
        matrix = get_rotation_matrix(placement.rotation)

        a,b,c,d,e,f,g,h,i = matrix

        lines.append(
            f"1 {color} "
            f"{x:g} {y:g} {z:g} "
            f"{a} {b} {c} "
            f"{d} {e} {f} "
            f"{g} {h} {i} "
            f"{brick.ldraw_part}"
        )

    lines.append("0 NOFILE")

    Path(filename).write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8"
    )


# ============================================================
# 7. TESTER FUNCTIONS
# ============================================================

def test_rotation(): 
    model = LegoGrid(4, 1, 4)

    model.place(BRICK_2X4, x=0, y=0, z=0, rotation=90)

    model.place(BRICK_2X4, x=2, y=0, z=0, rotation=270)

    print("Place bricks:", len(model.placements))

    for placement in model.placements:
        print(
            f"{placement.brick.name} "
            f"at ({placement.x}, {placement.y}, {placement.z}) "
            f"rotation={placement.rotation}"
        )

    output = Path(__file__).parent / "rotation_test.ldr"

    export_ldraw(model, output)

    print(f"LDraw file created at:\n{output}")

def test_rotation_90_180(): 
    model = LegoGrid(6, 1, 4)

    model.place(BRICK_2X4, x=0, y=0, z=0, rotation=90)

    model.place(BRICK_2X4, x=2, y=0, z=0, rotation=180)

    print("Place bricks:", len(model.placements))

    for placement in model.placements:
        print(
            f"{placement.brick.name} "
            f"at ({placement.x}, {placement.y}, {placement.z}) "
            f"rotation={placement.rotation}"
        )

    output = Path(__file__).parent / "rotation_test_90_180.ldr"

    export_ldraw(model, output)

    print(f"LDraw file created at:\n{output}")

# ============================================================
# 8. MAIN PROGRAM
# ============================================================

def main():

    # Size of the space we want to fill.
    width = 4
    height = 2
    depth = 4

    print(
        f"Building a "
        f"{width} x {height} x {depth} "
        f"LEGO structure..."
    )

    # Create an empty LEGO model.
    model = LegoGrid(
        width,
        height,
        depth
    )

    # Let the planner decide
    # which bricks to use.
    fill_space(model)

    print()
    print("=" * 40)

    print(
        f"Finished!"
    )

    print(
        f"Used "
        f"{len(model.placements)} bricks."
    )

    print("=" * 40)

    # Display the result in the terminal.
    model.print_layers()

    # Save the LDraw file beside this Python file.
    output = (
        Path(__file__).parent /
        "lego_auto_build_2x4.ldr"
    )

    export_ldraw(
        model,
        output
    )

    print()
    print(
        f"LDraw file created at:\n"
        f"{output}"
    )


# ============================================================
# 9. RUN THE PROGRAM
# ============================================================

if __name__ == "__main__":
   # test_rotation()
    test_rotation_90_180()
  #  main()