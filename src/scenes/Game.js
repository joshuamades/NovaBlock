import Phaser from "phaser";

import { adStart, onAudioVolumeChange } from "../networkPlugin";

const BOARD_SIZE = 8;
const PIECES_PER_ROUND = 3;
const BOARD_FRAME_SCALE = 1.05;
const GRID_AREA_SCALE = 1;
const GRID_OFFSET_X = 0;
const GRID_OFFSET_Y = -2;
const CELL_FILL_SCALE = 0.9;
const BLOCK_FILL_SCALE = 1.08;
const PIECE_TRAY_SCALE = 0.78;
const PIECE_SLOT_GAP_PORTRAIT = .3;
const PIECE_SLOT_GAP_LANDSCAPE = 0.14;
const INITIAL_BLOCK_SHAPE_COUNT = 5;
const LINE_CLEAR_DURATION = 420;
const LINE_PREVIEW_COLOR = 0x7f3cff;
const LINE_PREVIEW_EDGE_COLOR = 0xffd24a;
const LINE_CLEAR_BORDER_COLOR = 0xffd24a;
const SCORE_COUNT_DURATION = 420;
const BLOCK_CLEAR_START_DELAY = 90;
const BLOCK_CLEAR_STAGGER = 45;
const BLOCK_POP_DURATION = 260;
const BLOCK_SPARK_COLOR = 0xffd24a;
const BLOCK_SPARK_ALT_COLOR = 0xff42f7;

const BLOCK_KEYS = [
  "greenReplacement",
  "khakiReplacement",
  "orangeReplacement",
  "pinkReplacement",
  "redReplacement",
  "violetReplacement",
  "yellowReplacement",
];

const PIECE_SHAPES = [
  [[0, 0]],
  [
    [0, 0],
    [1, 0],
  ],
  [
    [0, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 1],
    [1, 0],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
  ],
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
];

export class Game extends Phaser.Scene {
  constructor() {
    super("Game");

    this.board = [];
    this.pieces = [];
    this.pieceViews = [];
    this.score = 0;
    this.displayScore = 0;
  }

  init() {
    console.log("%cSCENE::Game", "color: #fff; background: #f0f;");
  }

  /**
   * This is required specially for Mintegral & MRAID networks.
   * Do not remove if you are using those networks.
   */
  adNetworkSetup() {
    adStart();

    // This is required for MRAID networks, you can remove if you are not using MRAID
    onAudioVolumeChange(this.scene);
  }

  create() {
    this.adNetworkSetup();
    this.isEnding = false;

    this.switchSfx = this.sound.add("switch", { volume: 0.5 });
    this.switchCombo1Sfx = this.sound.add("switchCombo1", { volume: 0.3 });
    this.switchCombo2Sfx = this.sound.add("switchCombo2", { volume: 0.3 });
    this.switchCombo3Sfx = this.sound.add("switchCombo3", { volume: 0.3 });
    this.bgmSfx = this.sound.add("bgm", { loop: true, volume: 0.2 });
    this.hasStartedBgm = false;

    this.resetBoard();

    this.scoreText = this.add
      .text(0, 0, "0", {
        fontFamily: "Arial, sans-serif",
        fontSize: "86px",
        fontStyle: "700",
        color: "#ffffff",
        align: "center",
        stroke: "#181745",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.boardContainer = this.add.container(0, 0).setDepth(1);
    this.boardFrame = this.add.image(0, 0, "container").setOrigin(0.5);
    this.cellLayer = this.add.container(0, 0);
    this.previewLayer = this.add.container(0, 0);
    this.blockLayer = this.add.container(0, 0);
    this.effectLayer = this.add.container(0, 0);
    this.boardContainer.add([
      this.boardFrame,
      this.cellLayer,
      this.blockLayer,
      this.previewLayer,
      this.effectLayer,
    ]);

    this.piecesContainer = this.add.container(0, 0).setDepth(20);
    this.spawnPieces();

    this.input.on("dragstart", this.handleDragStart, this);
    this.input.on("drag", this.handleDrag, this);
    this.input.on("dragend", this.handleDragEnd, this);

    this.onViewportLayoutChange = () => {
      this.applyResponsiveLayout(this.scale.gameSize);
      if (this.viewportLayoutTimeout) {
        window.clearTimeout(this.viewportLayoutTimeout);
      }
      // iOS can report final viewport metrics slightly after rotation.
      this.viewportLayoutTimeout = window.setTimeout(() => {
        this.applyResponsiveLayout(this.scale.gameSize);
        this.viewportLayoutTimeout = null;
      }, 120);
    };
    window.addEventListener("resize", this.onViewportLayoutChange);
    window.addEventListener("orientationchange", this.onViewportLayoutChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        this.onViewportLayoutChange,
      );
    }

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
      this.input.off("dragstart", this.handleDragStart, this);
      this.input.off("drag", this.handleDrag, this);
      this.input.off("dragend", this.handleDragEnd, this);

      if (this.onViewportLayoutChange) {
        window.removeEventListener("resize", this.onViewportLayoutChange);
        window.removeEventListener(
          "orientationchange",
          this.onViewportLayoutChange,
        );
        if (window.visualViewport) {
          window.visualViewport.removeEventListener(
            "resize",
            this.onViewportLayoutChange,
          );
        }
      }
      if (this.viewportLayoutTimeout) {
        window.clearTimeout(this.viewportLayoutTimeout);
        this.viewportLayoutTimeout = null;
      }
      if (this.scoreTween) {
        this.scoreTween.stop();
        this.scoreTween.remove();
        this.scoreTween = null;
      }
    });

    this.applyResponsiveLayout(this.scale.gameSize);
    this.endIfNoAvailableMoves();
  }

  resetBoard() {
    this.score = 0;
    this.displayScore = 0;
    this.board = Array.from({ length: BOARD_SIZE }, () =>
      Array.from({ length: BOARD_SIZE }, () => null),
    );
    this.seedInitialBlocks();
  }

  seedInitialBlocks() {
    let placedShapes = 0;
    let attempts = 0;

    while (placedShapes < INITIAL_BLOCK_SHAPE_COUNT && attempts < 80) {
      attempts += 1;

      const shape = Phaser.Utils.Array.GetRandom(PIECE_SHAPES);
      const bounds = this.getShapeBounds(shape);
      const col = Phaser.Math.Between(0, BOARD_SIZE - bounds.cols);
      const row = Phaser.Math.Between(0, BOARD_SIZE - bounds.rows);

      if (!this.canPlacePiece({ shape }, col, row)) {
        continue;
      }

      const blockKey = Phaser.Utils.Array.GetRandom(BLOCK_KEYS);
      shape.forEach(([shapeCol, shapeRow]) => {
        this.board[row + shapeRow][col + shapeCol] = blockKey;
      });
      placedShapes += 1;
    }
  }

  spawnPieces() {
    this.pieces = Array.from({ length: PIECES_PER_ROUND }, (_, index) => ({
      id: `${Date.now()}-${index}-${Math.random()}`,
      shape: Phaser.Utils.Array.GetRandom(PIECE_SHAPES),
      blockKey: Phaser.Utils.Array.GetRandom(BLOCK_KEYS),
      placed: false,
    }));
  }

  applyResponsiveLayout(gameSize) {
    const width = Math.max(gameSize?.width || this.scale.width, 1);
    const height = Math.max(gameSize?.height || this.scale.height, 1);
    const viewportWidth = Math.max(
      Math.round(window.visualViewport?.width || window.innerWidth || width),
      1,
    );
    const viewportHeight = Math.max(
      Math.round(window.visualViewport?.height || window.innerHeight || height),
      1,
    );
    const centerX = width * 0.5;
    const isLandscape = viewportWidth > viewportHeight;

    const boardSize = Math.min(
      isLandscape ? height * 0.76 : width * 0.9,
      isLandscape ? width * 0.48 : height * 0.48,
    );
    this.boardSize = boardSize;
    this.gridSize = boardSize * GRID_AREA_SCALE;
    this.cellSize = this.gridSize / BOARD_SIZE;
    this.boardX = isLandscape ? width * 0.28 : centerX;
    this.boardY = isLandscape ? height * 0.54 : height * 0.52;
    this.gridOffsetX = GRID_OFFSET_X;
    this.gridOffsetY = GRID_OFFSET_Y;
    this.boardLeft = this.boardX + this.gridOffsetX - this.gridSize * 0.5;
    this.boardTop = this.boardY + this.gridOffsetY - this.gridSize * 0.5;

    if (this.scoreText) {
      this.scoreText.setText(`${Math.round(this.displayScore)}`);
      this.scoreText.setPosition(
        isLandscape ? width * 0.74 : centerX,
        isLandscape ? height * 0.18 : height * 0.12,
      );
    }

    this.renderBoard();
    this.renderPieces(isLandscape, width, height);
  }

  renderBoard() {
    if (!this.boardContainer) {
      return;
    }

    this.boardContainer.setPosition(this.boardX, this.boardY);
    this.boardFrame.setDisplaySize(
      this.boardSize * BOARD_FRAME_SCALE,
      this.boardSize * BOARD_FRAME_SCALE,
    );

    this.cellLayer.removeAll(true);
    this.clearLinePreview();
    this.blockLayer.removeAll(true);

    const cellFill = Math.max(this.cellSize * CELL_FILL_SCALE, 1);

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const x =
          this.gridOffsetX -
          this.gridSize * 0.5 +
          col * this.cellSize +
          this.cellSize * 0.5;
        const y =
          this.gridOffsetY -
          this.gridSize * 0.5 +
          row * this.cellSize +
          this.cellSize * 0.5;
        const cell = this.add
          .rectangle(x, y, cellFill, cellFill, 0x27265e, 0.72)
          .setStrokeStyle(Math.max(this.cellSize * 0.025, 1), 0x514fa5, 0.28);
        this.cellLayer.add(cell);

        const blockKey = this.board[row][col];
        if (blockKey) {
          this.blockLayer.add(this.createBlockImage(x, y, blockKey, this.cellSize));
        }
      }
    }
  }

  renderPieces(isLandscape, width, height) {
    if (!this.piecesContainer) {
      return;
    }

    this.piecesContainer.removeAll(true);
    this.pieceViews = [];

    const activePieces = this.pieces.filter((piece) => !piece.placed);
    if (!activePieces.length) {
      return;
    }

    const pieceCellSize = this.cellSize;
    const panelCenterX = isLandscape ? width * 0.74 : width * 0.5;
    const panelY = isLandscape ? height * 0.58 : height * 0.88;
    const slotGap = isLandscape
      ? height * PIECE_SLOT_GAP_LANDSCAPE
      : width * PIECE_SLOT_GAP_PORTRAIT;
    const startX =
      panelCenterX - ((activePieces.length - 1) * slotGap) * (isLandscape ? 0 : 0.5);
    const startY =
      panelY - ((activePieces.length - 1) * slotGap) * (isLandscape ? 0.5 : 0);

    activePieces.forEach((piece, index) => {
      const position = {
        x: isLandscape ? panelCenterX : startX + index * slotGap,
        y: isLandscape ? startY + index * slotGap : panelY,
      };
      const view = this.createPieceView(piece, pieceCellSize, position);
      this.piecesContainer.add(view);
      this.pieceViews.push(view);
    });
  }

  createPieceView(piece, pieceCellSize, position) {
    const bounds = this.getShapeBounds(piece.shape);
    const viewWidth = (bounds.cols || 1) * pieceCellSize;
    const viewHeight = (bounds.rows || 1) * pieceCellSize;
    const view = this.add.container(
      position.x - (viewWidth * PIECE_TRAY_SCALE) * 0.5,
      position.y - (viewHeight * PIECE_TRAY_SCALE) * 0.5,
    );

    piece.shape.forEach(([col, row]) => {
      const x = (col - bounds.minCol + 0.5) * pieceCellSize;
      const y = (row - bounds.minRow + 0.5) * pieceCellSize;
      view.add(this.createBlockImage(x, y, piece.blockKey, pieceCellSize));

      const dragHandle = this.add
        .rectangle(x, y, pieceCellSize, pieceCellSize, 0x000000, 0.001)
        .setInteractive({ useHandCursor: true });
      dragHandle.pieceView = view;
      this.input.setDraggable(dragHandle);
      view.add(dragHandle);
    });

    view.setSize(viewWidth, viewHeight);

    view.piece = piece;
    view.homeX = view.x;
    view.homeY = view.y;
    view.homeScale = PIECE_TRAY_SCALE;
    view.dragScale = 1;
    view.pieceCellSize = pieceCellSize;
    view.shapeBounds = bounds;
    view.setScale(view.homeScale);

    return view;
  }

  createBlockImage(x, y, textureKey, targetSize) {
    return this.add
      .image(x, y, textureKey)
      .setDisplaySize(targetSize * BLOCK_FILL_SCALE, targetSize * BLOCK_FILL_SCALE);
  }

  getDragPieceView(gameObject) {
    return gameObject?.pieceView || gameObject;
  }

  getShapeBounds(shape) {
    const cols = shape.map(([col]) => col);
    const rows = shape.map(([, row]) => row);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);

    return {
      minCol,
      minRow,
      cols: maxCol - minCol + 1,
      rows: maxRow - minRow + 1,
    };
  }

  handleDragStart(pointer, gameObject) {
    const pieceView = this.getDragPieceView(gameObject);

    if (!pieceView?.piece) {
      return;
    }

    this.startAudioOnFirstInteraction();
    this.piecesContainer.bringToTop(pieceView);
    pieceView.setDepth(100);

    const localPointerX = (pointer.x - pieceView.x) / pieceView.scaleX;
    const localPointerY = (pointer.y - pieceView.y) / pieceView.scaleY;

    pieceView.setScale(pieceView.dragScale);
    pieceView.dragOffsetX = localPointerX * pieceView.scaleX;
    pieceView.dragOffsetY = localPointerY * pieceView.scaleY;
    pieceView.setPosition(
      pointer.x - pieceView.dragOffsetX,
      pointer.y - pieceView.dragOffsetY,
    );
    this.updateLinePreview(pieceView);
  }

  handleDrag(pointer, gameObject) {
    const pieceView = this.getDragPieceView(gameObject);

    if (!pieceView?.piece) {
      return;
    }

    pieceView.setPosition(
      pointer.x - pieceView.dragOffsetX,
      pointer.y - pieceView.dragOffsetY,
    );
    this.updateLinePreview(pieceView);
  }

  handleDragEnd(pointer, gameObject) {
    const pieceView = this.getDragPieceView(gameObject);

    if (!pieceView?.piece) {
      return;
    }

    this.clearLinePreview();
    const placement = this.getPlacementFromPieceView(pieceView);

    if (placement && this.canPlacePiece(pieceView.piece, placement.col, placement.row)) {
      this.placePiece(pieceView.piece, placement.col, placement.row);
      pieceView.piece.placed = true;
      pieceView.destroy();
      this.playSwitchSound();
      const clearDuration = this.clearCompletedLines();

      if (this.pieces.every((piece) => piece.placed)) {
        this.spawnPieces();
      }

      this.applyResponsiveLayout(this.scale.gameSize);
      if (clearDuration > 0) {
        this.time.delayedCall(clearDuration, () => this.endIfNoAvailableMoves());
      } else {
        this.endIfNoAvailableMoves();
      }
      return;
    }

    if (!this.hasAnyAvailableMove()) {
      this.goToEndScene();
      return;
    }

    this.tweens.add({
      targets: pieceView,
      x: pieceView.homeX,
      y: pieceView.homeY,
      scale: pieceView.homeScale,
      duration: 180,
      ease: "Back.easeOut",
      onComplete: () => pieceView.setDepth(0),
    });
  }

  getPlacementFromPieceView(pieceView) {
    const bounds = pieceView.shapeBounds;
    const originX = pieceView.x + bounds.minCol * 0 + pieceView.pieceCellSize * 0.5;
    const originY = pieceView.y + bounds.minRow * 0 + pieceView.pieceCellSize * 0.5;
    const col = Math.round((originX - this.boardLeft - this.cellSize * 0.5) / this.cellSize);
    const row = Math.round((originY - this.boardTop - this.cellSize * 0.5) / this.cellSize);

    return { col, row };
  }

  updateLinePreview(pieceView) {
    const placement = this.getPlacementFromPieceView(pieceView);

    if (
      !placement ||
      !this.canPlacePiece(pieceView.piece, placement.col, placement.row)
    ) {
      this.clearLinePreview();
      return;
    }

    const completedLines = this.getCompletedLinesForPlacement(
      pieceView.piece,
      placement.col,
      placement.row,
    );

    this.renderLinePreview(completedLines);
  }

  renderLinePreview(lines) {
    if (!this.previewLayer) {
      return;
    }

    this.previewLayer.removeAll(true);

    if (!lines.rows.length && !lines.cols.length) {
      return;
    }

    const cellFill = Math.max(this.cellSize * BLOCK_FILL_SCALE, 1);
    const addLineBeam = (x, y, width, height) => {
      const core = this.add
        .rectangle(x, y, width, height, LINE_PREVIEW_COLOR, 0)
        .setStrokeStyle(Math.max(this.cellSize * 0.045, 2), LINE_PREVIEW_EDGE_COLOR, 0.85);
      this.previewLayer.add(core);
    };
    const addPreviewCell = (row, col) => {
      const { x, y } = this.getCellLocalPosition(row, col);
      const preview = this.add
        .rectangle(
          x,
          y,
          cellFill,
          cellFill,
          LINE_PREVIEW_COLOR,
          0,
        )
        .setStrokeStyle(Math.max(this.cellSize * 0.035, 1), LINE_PREVIEW_EDGE_COLOR, 0.9);
      this.previewLayer.add(preview);
    };

    lines.rows.forEach((row) => {
      const { y } = this.getCellLocalPosition(row, 0);
      addLineBeam(this.gridOffsetX, y, this.gridSize, this.cellSize * 1.18);
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        addPreviewCell(row, col);
      }
    });

    lines.cols.forEach((col) => {
      const { x } = this.getCellLocalPosition(0, col);
      addLineBeam(x, this.gridOffsetY, this.cellSize * 1.18, this.gridSize);
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        addPreviewCell(row, col);
      }
    });
  }

  clearLinePreview() {
    if (this.previewLayer) {
      this.previewLayer.removeAll(true);
    }
  }

  getCompletedLinesForPlacement(piece, col, row) {
    const boardPreview = this.board.map((boardRow) => [...boardRow]);

    piece.shape.forEach(([shapeCol, shapeRow]) => {
      boardPreview[row + shapeRow][col + shapeCol] = piece.blockKey;
    });

    return this.getCompletedLinesFromBoard(boardPreview);
  }

  getCompletedLinesFromBoard(board) {
    const rows = [];
    const cols = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (board[row].every(Boolean)) {
        rows.push(row);
      }
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board.every((row) => row[col])) {
        cols.push(col);
      }
    }

    return { rows, cols };
  }

  getCellLocalPosition(row, col) {
    return {
      x:
        this.gridOffsetX -
        this.gridSize * 0.5 +
        col * this.cellSize +
        this.cellSize * 0.5,
      y:
        this.gridOffsetY -
        this.gridSize * 0.5 +
        row * this.cellSize +
        this.cellSize * 0.5,
    };
  }

  canPlacePiece(piece, col, row) {
    return piece.shape.every(([shapeCol, shapeRow]) => {
      const boardCol = col + shapeCol;
      const boardRow = row + shapeRow;

      return (
        boardCol >= 0 &&
        boardCol < BOARD_SIZE &&
        boardRow >= 0 &&
        boardRow < BOARD_SIZE &&
        !this.board[boardRow][boardCol]
      );
    });
  }

  hasAnyAvailableMove() {
    return this.pieces
      .filter((piece) => !piece.placed)
      .some((piece) => {
        for (let row = 0; row < BOARD_SIZE; row += 1) {
          for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (this.canPlacePiece(piece, col, row)) {
              return true;
            }
          }
        }

        return false;
      });
  }

  endIfNoAvailableMoves() {
    if (!this.hasAnyAvailableMove()) {
      this.goToEndScene();
    }
  }

  goToEndScene() {
    if (this.isEnding) {
      return;
    }

    this.isEnding = true;
    this.input.enabled = false;
    this.scene.launch("EndScene");
    this.scene.bringToTop("EndScene");
    this.scene.pause();
  }

  placePiece(piece, col, row) {
    piece.shape.forEach(([shapeCol, shapeRow]) => {
      this.board[row + shapeRow][col + shapeCol] = piece.blockKey;
    });
  }

  clearCompletedLines() {
    const completedLines = this.getCompletedLinesFromBoard(this.board);
    const { rows: fullRows, cols: fullCols } = completedLines;

    if (!fullRows.length && !fullCols.length) {
      return 0;
    }

    this.playLineClearAnimation(completedLines);
    const destroyedCells = this.getDestroyedCells(completedLines);
    const clearDuration = this.clearDestroyedCellsOneByOne(destroyedCells);

    this.incrementScore(destroyedCells.length);
    this.playSwitchComboSound(fullRows.length + fullCols.length);

    return clearDuration;
  }

  getDestroyedCells(lines) {
    const destroyedCells = new Set();

    lines.rows.forEach((row) => {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        destroyedCells.add(`${row}:${col}`);
      }
    });

    lines.cols.forEach((col) => {
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        destroyedCells.add(`${row}:${col}`);
      }
    });

    return [...destroyedCells].map((cell) => {
      const [row, col] = cell.split(":").map(Number);
      return { row, col };
    });
  }

  clearDestroyedCellsOneByOne(cells) {
    if (!cells.length) {
      return 0;
    }

    cells.forEach(({ row, col }, index) => {
      this.time.delayedCall(BLOCK_CLEAR_START_DELAY + index * BLOCK_CLEAR_STAGGER, () => {
        const blockKey = this.board[row][col];
        if (blockKey) {
          this.playBlockClearPop(row, col, blockKey, index);
        }
        this.board[row][col] = null;
        this.renderBoard();
      });
    });

    return BLOCK_CLEAR_START_DELAY + (cells.length - 1) * BLOCK_CLEAR_STAGGER + LINE_CLEAR_DURATION;
  }

  playBlockClearPop(row, col, blockKey, index) {
    if (!this.effectLayer) {
      return;
    }

    const { x, y } = this.getCellLocalPosition(row, col);
    const block = this.createBlockImage(x, y, blockKey, this.cellSize)
      .setAlpha(0.95)
      .setAngle(index % 2 === 0 ? -4 : 4);
    const ring = this.add
      .rectangle(x, y, this.cellSize * 1.05, this.cellSize * 1.05, BLOCK_SPARK_COLOR, 0)
      .setStrokeStyle(Math.max(this.cellSize * 0.055, 2), BLOCK_SPARK_COLOR, 0.95);

    this.effectLayer.add([block, ring]);

    this.tweens.add({
      targets: block,
      alpha: 0,
      scale: 0.35,
      angle: block.angle * 2,
      duration: BLOCK_POP_DURATION,
      ease: "Back.easeIn",
      onComplete: () => block.destroy(),
    });

    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.42,
      duration: BLOCK_POP_DURATION,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });

    this.playBlockClearSparks(x, y, index);
  }

  playBlockClearSparks(x, y, seed) {
    const sparks = [];
    const sparkSize = Math.max(this.cellSize * 0.09, 3);
    const spread = this.cellSize * 0.42;

    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI * 2 * i) / 4 + seed * 0.35;
      const spark = this.add.rectangle(
        x,
        y,
        sparkSize,
        sparkSize,
        i % 2 === 0 ? BLOCK_SPARK_COLOR : BLOCK_SPARK_ALT_COLOR,
        0.9,
      );
      spark.targetX = x + Math.cos(angle) * spread;
      spark.targetY = y + Math.sin(angle) * spread;
      this.effectLayer.add(spark);
      sparks.push(spark);
    }

    sparks.forEach((spark) => {
      this.tweens.add({
        targets: spark,
        x: spark.targetX,
        y: spark.targetY,
        alpha: 0,
        scale: 0.25,
        angle: 45,
        duration: BLOCK_POP_DURATION,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    });
  }

  incrementScore(amount) {
    if (!amount) {
      return;
    }

    const previousScore = this.score;
    this.score += amount;

    if (!this.scoreText) {
      this.displayScore = this.score;
      return;
    }

    if (this.scoreTween) {
      this.scoreTween.stop();
      this.scoreTween.remove();
    }

    this.scoreTween = this.tweens.addCounter({
      from: previousScore,
      to: this.score,
      duration: SCORE_COUNT_DURATION,
      ease: "Cubic.easeOut",
      onUpdate: (tween) => {
        this.displayScore = tween.getValue();
        this.scoreText.setText(`${Math.round(this.displayScore)}`);
      },
      onComplete: () => {
        this.displayScore = this.score;
        this.scoreText.setText(`${this.score}`);
        this.scoreTween = null;
      },
    });

    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.18, to: 1 },
      duration: SCORE_COUNT_DURATION,
      ease: "Back.easeOut",
    });
  }

  playLineClearAnimation(lines) {
    if (!this.effectLayer) {
      return;
    }

    const effects = [];
    const addLineBorder = (x, y, width, height) => {
      const border = this.add
        .rectangle(x, y, width, height, LINE_CLEAR_BORDER_COLOR, 0)
        .setStrokeStyle(Math.max(this.cellSize * 0.08, 3), LINE_CLEAR_BORDER_COLOR, 1);

      this.effectLayer.add(border);
      effects.push(border);
    };

    lines.rows.forEach((row) => {
      const { y } = this.getCellLocalPosition(row, 0);
      addLineBorder(this.gridOffsetX, y, this.gridSize, this.cellSize * 1.12);
    });

    lines.cols.forEach((col) => {
      const { x } = this.getCellLocalPosition(0, col);
      addLineBorder(x, this.gridOffsetY, this.cellSize * 1.12, this.gridSize);
    });

    if (!effects.length) {
      return;
    }

    this.tweens.add({
      targets: effects,
      alpha: 0,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: LINE_CLEAR_DURATION,
      ease: "Cubic.easeOut",
      onComplete: () => {
        effects.forEach((effect) => effect.destroy());
      },
    });
  }

  handleResize(gameSize) {
    const width = Math.max(gameSize.width || this.scale.width, 1);
    const height = Math.max(gameSize.height || this.scale.height, 1);
    this.cameras.main.setSize(width, height);
    this.applyResponsiveLayout({ width, height });
  }

  playSwitchSound() {
    if (!this.sound || !this.sound.get("switch") || !this.switchSfx) return;
    if (this.switchSfx.isPlaying) {
      this.switchSfx.stop();
    }
    this.switchSfx.play();
  }

  playSwitchComboSound(combo) {
    const normalizedCombo = ((Math.max(combo, 1) - 1) % 3) + 1;
    const comboKey = `switchCombo${normalizedCombo}`;
    if (!this.sound || !this.sound.get(comboKey)) return;

    const comboSfx = this[`switchCombo${normalizedCombo}Sfx`];
    if (!comboSfx) {
      return;
    }

    if (comboSfx.isPlaying) {
      comboSfx.stop();
    }
    comboSfx.play();
  }

  playBGMSound() {
    if (!this.sound || !this.sound.get("bgm")) return false;
    if (!this.bgmSfx) return false;
    if (this.bgmSfx.isPlaying) return true;
    if (this.bgmSfx.isPaused) {
      this.bgmSfx.resume();
      return true;
    }
    return this.bgmSfx.play();
  }

  startAudioOnFirstInteraction() {
    if (this.hasStartedBgm) {
      return;
    }

    this.hasStartedBgm = this.playBGMSound();
  }
}
