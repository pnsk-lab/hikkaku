#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

BOARD_SIZE = 8
BOARD_CELLS = BOARD_SIZE * BOARD_SIZE
DIRECTIONS: tuple[tuple[int, int], ...] = (
    (-1, -1),
    (0, -1),
    (1, -1),
    (-1, 0),
    (1, 0),
    (-1, 1),
    (0, 1),
    (1, 1),
)

INPUT_SIZE = 6
HIDDEN_SIZE = 32


def index_of(x: int, y: int) -> int:
    return y * BOARD_SIZE + x


def in_board(x: int, y: int) -> bool:
    return 0 <= x < BOARD_SIZE and 0 <= y < BOARD_SIZE


def initial_board() -> list[int]:
    board = [0] * BOARD_CELLS
    board[index_of(3, 3)] = 2
    board[index_of(4, 3)] = 1
    board[index_of(3, 4)] = 1
    board[index_of(4, 4)] = 2
    return board


def get_flips(board: list[int], x: int, y: int, player: int) -> list[int]:
    if board[index_of(x, y)] != 0:
        return []

    opponent = 3 - player
    flips: list[int] = []

    for dx, dy in DIRECTIONS:
        cx = x + dx
        cy = y + dy
        captured: list[int] = []

        while in_board(cx, cy) and board[index_of(cx, cy)] == opponent:
            captured.append(index_of(cx, cy))
            cx += dx
            cy += dy

        if captured and in_board(cx, cy) and board[index_of(cx, cy)] == player:
            flips.extend(captured)

    return flips


def legal_moves(board: list[int], player: int) -> list[tuple[int, int, list[int]]]:
    moves: list[tuple[int, int, list[int]]] = []
    for y in range(BOARD_SIZE):
        for x in range(BOARD_SIZE):
            flips = get_flips(board, x, y, player)
            if flips:
                moves.append((x, y, flips))
    return moves


def apply_move(board: list[int], x: int, y: int, flips: Iterable[int], player: int) -> None:
    board[index_of(x, y)] = player
    for idx in flips:
        board[idx] = player


def winner(board: list[int]) -> int:
    black = sum(1 for cell in board if cell == 1)
    white = sum(1 for cell in board if cell == 2)
    if black > white:
        return 1
    if white > black:
        return 2
    return 0


def move_features(board: list[int], player: int, x: int, y: int, flip_count: int) -> list[float]:
    occupied = sum(1 for cell in board if cell != 0)
    progress = occupied / BOARD_CELLS

    is_corner = 1.0 if (x in (0, 7) and y in (0, 7)) else 0.0
    is_edge = 1.0 if (x in (0, 7) or y in (0, 7)) else 0.0
    is_x_square = 1.0 if (x, y) in ((1, 1), (1, 6), (6, 1), (6, 6)) else 0.0
    player_is_black = 1.0 if player == 1 else -1.0

    return [
        flip_count / 18.0,
        is_corner,
        is_edge,
        is_x_square,
        progress,
        player_is_black,
    ]


@dataclass
class Network:
    w1: list[list[float]]
    b1: list[float]
    w2: list[float]
    b2: float

    @classmethod
    def random(cls, rng: random.Random) -> 'Network':
        w1 = [
            [rng.uniform(-0.4, 0.4) for _ in range(INPUT_SIZE)]
            for _ in range(HIDDEN_SIZE)
        ]
        b1 = [0.0 for _ in range(HIDDEN_SIZE)]
        w2 = [rng.uniform(-0.4, 0.4) for _ in range(HIDDEN_SIZE)]
        return cls(w1=w1, b1=b1, w2=w2, b2=0.0)

    def forward(self, x: list[float]) -> tuple[float, list[float], list[float]]:
        z = [
            self.b1[j] + sum(self.w1[j][i] * x[i] for i in range(INPUT_SIZE))
            for j in range(HIDDEN_SIZE)
        ]
        h = [max(0.0, value) for value in z]
        y = self.b2 + sum(self.w2[j] * h[j] for j in range(HIDDEN_SIZE))
        return y, z, h

    def score(self, x: list[float]) -> float:
        y, _, _ = self.forward(x)
        return y

    def train_sample(self, x: list[float], target: float, lr: float) -> float:
        pred, z, h = self.forward(x)
        loss = (pred - target) ** 2

        dy = 2.0 * (pred - target)

        grad_w2 = [dy * h_j for h_j in h]
        grad_b2 = dy

        dz = [0.0 for _ in range(HIDDEN_SIZE)]
        for j in range(HIDDEN_SIZE):
            if z[j] > 0.0:
                dz[j] = dy * self.w2[j]

        grad_w1 = [
            [dz[j] * x[i] for i in range(INPUT_SIZE)] for j in range(HIDDEN_SIZE)
        ]
        grad_b1 = dz

        for j in range(HIDDEN_SIZE):
            self.w2[j] -= lr * grad_w2[j]
        self.b2 -= lr * grad_b2

        for j in range(HIDDEN_SIZE):
            for i in range(INPUT_SIZE):
                self.w1[j][i] -= lr * grad_w1[j][i]
            self.b1[j] -= lr * grad_b1[j]

        return loss


def self_play_game(
    net: Network,
    rng: random.Random,
    epsilon: float,
) -> tuple[list[tuple[list[float], int]], int]:
    board = initial_board()
    player = 1
    pass_count = 0
    trajectory: list[tuple[list[float], int]] = []

    while pass_count < 2:
        moves = legal_moves(board, player)
        if not moves:
            pass_count += 1
            player = 3 - player
            continue

        pass_count = 0
        if rng.random() < epsilon:
            x, y, flips = rng.choice(moves)
            feats = move_features(board, player, x, y, len(flips))
        else:
            best = None
            best_score = -math.inf
            for mx, my, flips in moves:
                feats = move_features(board, player, mx, my, len(flips))
                score = net.score(feats)
                if score > best_score:
                    best_score = score
                    best = (mx, my, flips, feats)
            assert best is not None
            x, y, flips, feats = best

        trajectory.append((feats, player))
        apply_move(board, x, y, flips, player)
        player = 3 - player

    return trajectory, winner(board)


def train(
    games: int,
    lr: float,
    epsilon_start: float,
    epsilon_end: float,
    seed: int,
) -> Network:
    rng = random.Random(seed)
    net = Network.random(rng)

    for game in range(1, games + 1):
        mix = game / max(games, 1)
        epsilon = epsilon_start + (epsilon_end - epsilon_start) * mix

        trajectory, game_winner = self_play_game(net, rng, epsilon)

        rng.shuffle(trajectory)
        for feats, player in trajectory:
            if game_winner == 0:
                target = 0.0
            elif player == game_winner:
                target = 1.0
            else:
                target = -1.0
            net.train_sample(feats, target, lr)

        if game % max(games // 10, 1) == 0:
            print(f'game={game} epsilon={epsilon:.3f}')

    return net


def flatten_w1(w1: list[list[float]]) -> list[float]:
    out: list[float] = []
    for row in w1:
        out.extend(row)
    return out


def round_list(values: Iterable[float], digits: int = 6) -> list[float]:
    return [round(v, digits) for v in values]


def write_outputs(net: Network, json_path: Path | None, ts_path: Path | None) -> None:
    payload = {
        'inputSize': INPUT_SIZE,
        'hiddenSize': HIDDEN_SIZE,
        'w1': round_list(flatten_w1(net.w1)),
        'b1': round_list(net.b1),
        'w2': round_list(net.w2),
        'b2': round(net.b2, 6),
    }

    if json_path:
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
        print(f'wrote {json_path}')

    if ts_path:
        ts_path.parent.mkdir(parents=True, exist_ok=True)
        ts = (
            'export const NN_WEIGHTS = '
            + json.dumps(payload, ensure_ascii=False, indent=2)
            + ' as const\n'
        )
        ts_path.write_text(ts)
        print(f'wrote {ts_path}')


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Train a tiny self-play NN for Reversi and export weights for Hikkaku.',
    )
    parser.add_argument('--games', type=int, default=4000)
    parser.add_argument('--lr', type=float, default=0.001)
    parser.add_argument('--epsilon-start', type=float, default=0.35)
    parser.add_argument('--epsilon-end', type=float, default=0.05)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--output-json', type=Path, default=None)
    parser.add_argument('--output-ts', type=Path, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    net = train(
        games=args.games,
        lr=args.lr,
        epsilon_start=args.epsilon_start,
        epsilon_end=args.epsilon_end,
        seed=args.seed,
    )
    write_outputs(net, args.output_json, args.output_ts)


if __name__ == '__main__':
    main()
