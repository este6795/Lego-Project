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
    1,
    2,
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
    2,
    4,
    1,
    "3001.dat"
)


# Try larger bricks first.
BRICKS = [
    # BRICK_2X4,
   # BRICK_2X2,
    BRICK_1X2,
    BRICK_1X1,
]


# ============================================================
# 2. BRICK PLACEMENT
# ============================================================

@dataclass(frozen=True)
class Placement:
    brick: Brick
    x: int
    y: int
    z: int


# ============================================================
# 3. LEGO GRID
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

    def can_place(self, brick, x, y, z):

        # Don't allow negative coordinates.
        if x < 0 or y < 0 or z < 0:
            return False

        # Make sure the brick stays inside the model.
        if x + brick.width > self.width:
            return False

        if y + brick.height > self.height:
            return False

        if z + brick.depth > self.depth:
            return False

        # Check every grid cell occupied by the brick.
        for dx in range(brick.width):
            for dy in range(brick.height):
                for dz in range(brick.depth):

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

    def has_support(self, brick, x, y, z):

        # Ground supports the brick.
        if y == 0:
            return True

        # Check every position underneath the brick.
        for dx in range(brick.width):
            for dz in range(brick.depth):

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

    def place(self, brick, x, y, z):

        # First make sure it fits.
        if not self.can_place(brick, x, y, z):
            raise ValueError(
                f"{brick.name} cannot be placed at "
                f"({x}, {y}, {z})"
            )

        # Then make sure it is supported.
        if not self.has_support(brick, x, y, z):
            raise ValueError(
                f"{brick.name} is not supported at "
                f"({x}, {y}, {z})"
            )

        # Create a record of this placement.
        placement = Placement(
            brick,
            x,
            y,
            z
        )

        # Mark every grid cell occupied by the brick.
        for dx in range(brick.width):
            for dy in range(brick.height):
                for dz in range(brick.depth):

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
    # Find every brick that can fit at a position
    # --------------------------------------------------------

    def get_candidates(self, x, y, z):

        candidates = []

        for brick in BRICKS:

            if self.can_place(brick, x, y, z):

                if self.has_support(
                    brick,
                    x,
                    y,
                    z
                ):
                    candidates.append(brick)

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
# 4. AUTOMATIC LEGO PLANNER
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
# 5. EXPORT TO LDRAW
# ============================================================

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
        x = placement.x * 20
        y = placement.y * 24
        z = placement.z * 20

        lines.append(
            f"1 {color} "
            f"{x} {y} {z} "
            f"1 0 0 "
            f"0 1 0 "
            f"0 0 1 "
            f"{brick.ldraw_part}"
        )

    lines.append("0 NOFILE")

    Path(filename).write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8"
    )


# ============================================================
# 6. MAIN PROGRAM
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
        "lego_auto_build_3.ldr"
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
# 7. RUN THE PROGRAM
# ============================================================

if __name__ == "__main__":
    main()