"""
this will take a grid layout, specified as a binary array,
and compute the vertices needed to create the grid
"""

def convert_dir(dir):
    if dir is None:
        return 'north'
    x, y = dir
    if x == 1:
        return 'east'
    if y == 1:
        return 'north'
    if x == -1:
        return 'west'
    if y == -1:
        return 'south'

def sorted_dirs(current_dir):
    world_dir = convert_dir(current_dir)
    if world_dir == 'north':
        return [(1,0), (0,1), (-1,0), (0,-1)]
    elif world_dir == 'west':
        return [(0,1), (-1,0), (0,-1), (1,0)]
    elif world_dir == 'south':
        return [(-1,0), (0,-1), (1,0), (0,1)]
    elif world_dir == 'east':
        return [(0,-1), (1,0), (0,1), (-1,0)]

class Grid:
    def __init__(self, layout):
        self.layout = layout
        self.height = len(layout)
        self.width = len(layout[0])

    def _convert_pos(self, pos):
        # x, y
        return pos[0], self.height - pos[1] - 1

    def val(self, pos):
        x, y = pos
        if y >= self.height or x >= self.width:
            return 0
        if y < 0 or x < 0:
            return 0
        x, y = self._convert_pos(pos)
        return self.layout[y][x]

    def possible_dirs(self, current_dir, pos):
        dirs = []
        x, y = pos

        if x + 1 <= self.width:
            dirs.append((1, 0))
        if y + 1 <= self.height:
            dirs.append((0, 1))
        if x - 1 >= 0:
            dirs.append((-1, 0))
        if y - 1 >= 0:
            dirs.append((0, -1))

        # this order is important
        # try dirs in this order:
        # right, up, left, down

        return [d for d in sorted_dirs(current_dir) if d in dirs]

    def valid_dirs(self, current_dir, pos):
        x, y = pos
        valid = []
        possible = self.possible_dirs(current_dir, pos)
        for dir in possible:
            x_step, y_step = dir
            if y_step == 1:
                to_check = [(x, y), (x-1, y)]
            elif y_step == -1:
                to_check = [(x, y-1), (x-1, y-1)]
            elif x_step == 1:
                to_check = [(x, y), (x, y-1)]
            elif x_step == -1:
                to_check = [(x-1, y), (x-1, y-1)]
            if self.is_boundary(to_check[0], to_check[1]):
                valid.append(dir)
        return valid

    def is_empty(self, pos):
        return self.val(pos) == 0

    def is_boundary(self, pos_a, pos_b):
        return self.val(pos_a) != self.val(pos_b)

layout = [
    [   1,  1,  1,  1,  1],
    [   1,  1,  0,  1,  0],
    [   0,  0,  0,  0,  1]
]

expected = [
    (4,0),
    (5,0),
    (5,1),
    (4,1),
    (4,2),
    (5,2),
    (5,3),
    (0,3),
    (0,1),
    (2,1),
    (2,2),
    (3,2),
    (3,1),
    (4,1),
    (4,0)
]


grid = Grid(layout)

def start_pos():
    # find start position,
    # the lowest-leftmost non-zero position
    for i, row in enumerate(reversed(layout)):
        for j, col in enumerate(row):
            if col == 1:
                return j, i

pos = start_pos()
vertices = []
last_dir = None

while True:
    x, y = pos
    dirs = grid.valid_dirs(last_dir, pos)
    new_dir = dirs[0]
    new_pos = (x + new_dir[0], y + new_dir[1])
    if last_dir != new_dir:
        vertices.append(pos)
    last_dir = new_dir
    if vertices and new_pos == vertices[0]:
        break
    pos = new_pos
for v, x in zip(vertices, expected):
    print(v, x)