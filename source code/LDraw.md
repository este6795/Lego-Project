# LDraw and Syntax

This is a document containing basic LDraw operations and gives a general idea on how the software works.

## What is LDraw

Ldraw is a text-based CAD/Modeling format that allows users to create lego like creations using numerical representations.
The official specification says LDraw files are text based, use UTF-8, and commonly use the .ldr, .dat, or .mpd extensions. A file contains one command per line, and the first tokens on a non-empty line identifies its line type.

|File Extension|                            Purpose                             |
| -----------  |--------------------------------------------------------------- |
|    .ldr      |  A model/submodel file                                         |
|    .dat      | Typically defines a lego part in the LDraw Library             |
|    .mpd      | A multi-part model that contains many submodels within the file|

## File Contents

LDraw parses files line by line starting from the top and working it's way to the bottom. The key detail is that the first numerical number in the line will define what the reset of the numbers are. There are 6 different operator numbers that are important in order to understand how LDraw works.

|  Type |  Purpose            |   Usage in Lego builder                                  |
| ----- | ------------------- | -------------------------------------------------------- |
|   0   |   Comment           | Used for metadata, comments, parsing instructions        |
|   1   |  Sub-file reference | Placing lego parts and submodels                         |
|   2   |  Line               | Parts geometry/ edges                                    |
|   3   |  Triangle           | Part geometry                                            |
|   4   | Quadrilateral       |  Part geometry                                           |
|   5   | Optional Line       | Conditional edge rendering                               |

The most important types for this project are 0 and 1. As these will allow use to place lego parts where we want them, at what angle, and define what kind of part they are.

### Type 0 Comments/Meta Commands

When it comes to Type 0, it is usually used for comments and metadata. Comments are well, just comments they do not create any visual geometry but do help define things such as file name, libraries, marking the end of steps (which will be useful later when we get the lego instruction building), and various other things.

|     Command    |                Purpose            |                       Usage                             |
| -------------- | --------------------------------- |---------------------------------------------------------|
|     0 STEP     | Marks the end of a build step     | Can be used to help make building instructions          |
|  0 FIlE name   | Starts a file in an .mpd          | Useful for multi-model files                            |
| 0 NOFILE       | Ends an embedded .mpd file        | Usefule for .mpd                                        |
| 0 ROTSTEP      | Controls step/view rotation       | Optional, if a different CAD software doesn't work      |
| 0 !LDraw_ORG ..| Identifies a file/library type    | Useful for formal files, or accessing specific libraries|
| 0 // ....      | Comment                           | Useful for generate/debug output                        |

### Type 1 Lego Piece Geometry

Type 1 is used to define parts or pieces stored in the LDraw library and helps place the part. A type 1 line will typically look like this:

```Python
  1 <color> <x_coordinate> <y_coordinate> <z_coordinate> a b c d e f g h i <file>
```

Notice that in the line we have several parts. Each part of the line helps define something about the lego piece that is being placed. The `<color>` part is helping define the color of the lego piece. The `x`,`y`, and `z` help define where the lego piece is at. And the a-i, is a matrix that is used to define its orientation and scaling angle which will be explained a bit later. For quick reference a table is placed below.

|        Field      | Meaning                                  |
| ----------------- | ---------------------------------------- |
|          1        | Line type                                |
|        color      | Defines the color of the piece           |
|      x y z        | Defines position of the lego piece       |
| a b c d e f g h i | 3x3 matrix defining orentation and scale |
|      file         | Defines which piece is being placed      |

Consider the following line:

```Python
   1 4 0 0 0 1 0 0 0 1 0 0 0 1 3003.dat
```

![A red2x2 Lego Brick placed on a grid](https://grabcad.com/screenshots/pics/268b5d3a88a816f337b0f330247cc8b4/large.png)

This line defines a red 2x2 lego piece placed at the origin plane (0,0,0). Now it has to be mentioned that LDraw uses a fairly unique coordinate plane but this will be discussed in a later section.

## Understanding the Matrix

The nine value matrix is not nine independent points of reference that is used to orient the lego piece. Instead it is a matrix that in itself allows for much more precise and detailed rotation of a lego piece. Moreover it is used in parallel with the x y z coordinates to help define the placement of a lego piece. The following calculation is the offical way that lego piece are defined and placed on the grid.

``` Python
    u' = a*u + b*v + c*w + x
    v' = d*u + e*v + f*w + y
    w' = g*u + h*v + i*w + z
```

In the context of this project, it is vital to understand how the matrix works in order to be able to rotate lego pieces when part of a bigger set of legos.

### The Coordinate Plane

As stated before the coordinate plane of LDraw is slightly different from what one would intuitively think it is. Unlike most coordinate planes, the LDraw one defines the x axis as positive, the z axis as positive, but the y axis as a negative value.

![LDraw coordinate plane specifications](https://www.ldraw.org/uploads/images/Articles/LDrawCoordsSystem.png)

Moreover, lego pieces do not have a 1:1 ratio in the coordinate plane. Instead they are given units of measurement in this case LDraw Units (LDU). The table below provides are quick reference to how LDraw defines lego brick sizes.

|          Measurement               |      LDraw Value        |
| ---------------------------------- | ----------------------- |
|        1 Brick width/depth         |        20 LDU           |
|1 Brick Height                      |        24 LDU           |
|1 Plate Height                      |        8 LDU            |
|1 Stud Diameter                     |        12 LDU           |
|1 Stud Height                       |        4 LDU            |
|Approximate Real life size of 1 LDU | 0.4mm or 1/64 of an inch|

![LDraw Brick size specifications](https://www.ldraw.org/uploads/images/Articles/dim.png)

As for the lego placement algorithm, it needs to be able to translate placed bricks accurately from its internal grid to the LDraw grid correctly, otherwise unwanted overlaps or the output may be correct internally but may be show incorrectly later on.

### Colors

Ldraw supports many colors which obviously define the color of the brick, but it can also define what material the lego piece of made of. As of now the main focus will be on a basic colors as well as some important "colors" that have different functions.

| LDraw color number |     Common Name       |
| ------------------ | --------------------- |
|        1           |        Blue           |
|        2           |        Green          |
|        3           |        Teal           |
|        4           |        Red            |
|        5           |        Magenta        |
|        6           |        Brown          |
|        7           |        Light Gray     |
|        8           |        Dark Gray      |
|        9           |        Light Blue     |
|        10          |        Bright Green   |
|        11          |        Yellow         |
|        12          |        White          |
|        13          |        Light Green    |
|        14          |        Sand Blue      |
|        15          |        Black          |
|        16          |        Main Color     |
|        24          |        Edge Color     |

![Ldraw Colors](https://www.ldraw.org/uploads/images/Articles/VisualLDconfig.png)

Colors 16 and 24 are unique as they do not have a traditional color associated with them. Instead color 16, follows the main color of other bricks around it. While color 24 is primarily used by line types 2 and 5 for edge rendering. In our earlier example, the brick was given the color code 4, which means it is a red brick.

### Type 2-5 Geometry

Type 2-5 lines are not generally important for this project however it is important to at least know what theses do. A quick reference table is inserted below to help explain their functions. But as stated before this are considered "out of scope" as we should only be working with predefined lego parts rather than try and create our own.

| Type    |             Syntax                         |        Purpose            |
| ------- | ------------------------------------------ | ------------------------- |
| 2       | 2 color x1 y1 z1 x2 y2 z2                  | Line between two points.  |
| 3       | 3 color x1 y1 z1 x2 y2 z2 x3 y3 z3         | Filled triangle.          |
| 4       | 4 color x1 y1 z1 x2 y2 z2 x3 y3 z3 x4 y4 z4| Filled quadrilateral.     |
| 5       | 5 color x1 y1 z1 x2 y2 z2 x3 y3 z3 x4 y4 z4| Optional/conditional line.|

## LDraw Limitations

As with any software, there has to be some kind of limitation as for LDraw, several exist.

- Overlapping is not checked

- Studs are not checked for actual connection

- Lego builds are not checked for physical buildability

Now fortunately the lego building algorithm should be able to check for such things, however if any mistakes are made or if the lego builder does not check for these items properly, the final product may not be what was actually expected. However, LDraw is a powerful tool and it is worth learning the documentation of the software.
