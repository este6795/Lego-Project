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

### Type 1

Type 1 is used to define parts or pieces stored in the LDraw library and helps place the part. A type 1 line will typically look like this:

```Python
  1 <color> <x_coordinate> <y_coordinate> <z_coordinate> a b c d e f g h i <file>
```

Notice that in the line we have several parts. Each part of the line helps define something about the lego piece that is being placed. The `<color>` part is helping define the color of the lego piece. The `x`,`y`, and `z` help define where the lego piece is at. And the a-i part of the line is used to define its rotation angle which will be explained a bit later.

