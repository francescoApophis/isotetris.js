import {Shape} from "./shape.js";
import {FPS, FPS_INTERVAL, LEVEL_FPS, LEVEL_FPS_INTERVAL, C_W, C_H, ROWS, COLS, BLOCK_SIZE} from "./settings.js";
// import {render_isometric_table} from "./utils.js";

export class Game {
  constructor(ctx, canvas, pixel_art_txr, isometric_txr){
    this.ctx = ctx;
    this.canvas = canvas;
    this.pixel_art_txr = pixel_art_txr;
    this.isometric_txr = isometric_txr;

    this.pause_game = false;
    this.iso_mode = true;
    this.debug_mode = false;

    this.move_left    = false;
    this.move_right   = false;
    this.move_down    = false;
    this.rotate_right = false;
    this.rotate_left  = false;

    this.current_shape;
    this.current_shape_num = 1;
    this.table = [...Array(ROWS * COLS)].map(() => {
      return 0;
    });
  }

  start(){
    let then = Date.now();
    let level_then = then;
    this.current_shape = Shape.new_rand(this.current_shape_num);
    this.current_shape.load_on_table(this.table);

    this.game_loop(then, level_then);
  }

  game_loop(then, level_then){
    let now = Date.now();
    let elapsed = now - then;
    let level_elapsed = now - level_then;

    if (elapsed >= FPS_INTERVAL){
      then = now - (elapsed % FPS_INTERVAL);
      this.render();

      if (!this.pause_game){
        this.manage_user_input();
        this.handle_shape_docking();
      }
    }

    if (level_elapsed >= LEVEL_FPS_INTERVAL){
      level_then = now - (level_elapsed % LEVEL_FPS_INTERVAL);
      if (!this.pause_game) {
        this.current_shape.drop(this.table);
      }
    }
    requestAnimationFrame(()=> this.game_loop(then, level_then));
  }

  render(){
    this.ctx.clearRect(0, 0, C_W, C_H);

    if (this.pause_game) this.render_pause();

    if (this.debug_mode) {
      this.render_debug_mode();
    } else if (this.iso_mode) {
      this.render_isometric_mode();
    } else {
      this.render_pixel_art_mode();
    }
  }


  render_debug_mode(){
    this.ctx.fillStyle = 'black';
    this.ctx.globalAlpha = 1;
    let table_offset = 25;
    let font_offset = table_offset + 10;
    let smaller_block_size = BLOCK_SIZE - 5;
    const colors = ['red', 'blue','green', 'yellow', 'purple', 'orange', 'pink'];

    for (let i = 0; i < ROWS * COLS; i++){
      let y = Math.floor(i / ROWS) * smaller_block_size;
      let x = (i % (ROWS)) * smaller_block_size;

      if (this.table[i] != 0){
        this.ctx.fillStyle = colors[(this.table[i] - 1) % 7];
        this.ctx.fillRect(x + table_offset, y + table_offset, smaller_block_size, smaller_block_size);
      }

      this.ctx.fillStyle = 'black';
      this.ctx.strokeRect(x + table_offset, y + table_offset, smaller_block_size, smaller_block_size);
      this.ctx.fillText(this.table[i], x + font_offset - 2.5, y + font_offset + 5); // cell value

      if (y / smaller_block_size == 0){
        this.ctx.fillText(i, x + font_offset, y + table_offset - 5); // ROWS
      }

      if (x / smaller_block_size == 0){
        this.ctx.fillText(i / 10, x + table_offset - 15, y + font_offset + 5); // COLS
      }
    }
  }

  render_isometric_mode(){
    this.ctx.fillStyle = '#6f54b8';
    this.ctx.globalAlpha = 1;
    this.ctx.fillRect(0, 0, 250, 550);

    let rows = COLS;
    let cols = ROWS;

    // Isometric Block
    let ib_width = 243; 
    let ib_height = 282;
    let ib_top_left_vertex = 69;
    let res = 6;

    for (let x = rows; x >= 0; x--){
      for (let y = 0; y < cols; y++){
        let cell = this.table[x * cols + y];

        if ( cell == 0 || cell === undefined) continue;

        this.ctx.drawImage(
          this.isometric_txr, 
          ((cell - 1) % 7) * ib_width, 
          0,
          ib_width,
          ib_height,
          y *  (ib_width / 2) / res,
          (x * (ib_height / 2) + ib_top_left_vertex * y) / res - 50,
          ib_width / res,
          ib_height / res,
        );
      }
    }
  }

  render_pixel_art_mode(){
    let table_offset = 0;
    this.ctx.fillStyle = 'rgb(38, 48, 57)';
    this.ctx.globalAlpha = 1;
    this.ctx.fillRect(table_offset, table_offset, ROWS * BLOCK_SIZE, COLS * BLOCK_SIZE);

    for (let i = 0; i < ROWS * COLS; i++){
      if (this.table[i] == 0) continue;

      let x = Math.floor(i / ROWS);
      let y = (i % (ROWS));

      this.ctx.drawImage(
        this.pixel_art_txr, 
        ((this.table[i] - 1) % 7) * 64, 
        0,
        64,
        64, 
        y * BLOCK_SIZE + table_offset,
        x * BLOCK_SIZE + table_offset,
        BLOCK_SIZE,
        BLOCK_SIZE, 
      );
    }
  }


  visualize_shape_rot_matrices(){
    let m = this.current_shape.rot_matrices;

    let a = 50;
    
    for (let j = 0; j < 4; j++){

      a += 150;
      for (let i = 0; i < 9; i++){
        let x = i % 3;
        let y = Math.floor(i / 3);

        if (m[j * 9 + i] != '1') continue;
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(x * BLOCK_SIZE + 25, y * BLOCK_SIZE + 25 + a, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }


  render_pause(){
    let font_size = 20;
    this.ctx.fillStyle = 'rgba(0,0,0, 0.2)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.font = `{font_size}px Arial`;
    this.ctx.fillText('Pause', this.canvas.width - font_size , this.canvas.height);
  }




  clear_row(){
    let last_cleared_row = -1;
    this.current_shape.blocks.forEach((block) => {
      for (let y = 0; y < ROWS; y++){
        if (this.table[block.x * ROWS + y] == 0) return;  
      }

      for (let y = 0; y < ROWS; y++){
        this.table[block.x * ROWS + y] = 0; 
      }

      last_cleared_row = block.x;
    });

    return last_cleared_row;
  }


  drop_previous_shapes(last_cleared_row){
    const table_copy = [];
    for (let i = 0; i < ROWS * COLS; i++){
      table_copy[i] = this.table[i];
    }

    for (let i = 0; i < ROWS * COLS; i++){
      let y = Math.floor(i / ROWS);

      if (y >= last_cleared_row) break; 
      this.table[i] = 0;
    }

    // 'i' starts looping from last item in the row above 'last_cleared_row'
    for (let i = (last_cleared_row - 1) * ROWS + ROWS - 1; i > 0; i--){
      let x = i % ROWS;
      let y = Math.floor(i / ROWS);
      let curr_block_tv = table_copy[i]; // table value 

      if (curr_block_tv != 0){
        let y_offset = 1;

        for (; y_offset < COLS ; y_offset++){
          let cell_below = this.table[(y + y_offset) * ROWS + x];

          if (cell_below != 0 || cell_below === undefined) {
            break;
          }
        }
        this.table[(y + y_offset - 1) * ROWS + x] = curr_block_tv;
      }
    }
  }







  handle_shape_docking(){
    if (this.current_shape.docked){
      let last_cleared_row = this.clear_row();

      if (last_cleared_row !== -1) {
        this.drop_previous_shapes(last_cleared_row);
      }

      this.current_shape_num++;
      this.current_shape = Shape.new_rand(this.current_shape_num);
    }
  }

  manage_user_input(){

    if (this.rotate_left){
      this.current_shape.rotate(this.table, this.ctx, false);
      this.rotate_left = false;
    }

    if (this.rotate_right){
      this.current_shape.rotate(this.table, this.ctx, true);
      this.rotate_right  = false;
    }

    if (this.move_left){
      this.current_shape.move_hor(true, this.table);
    }
    
    if (this.move_right){
      this.current_shape.move_hor(false, this.table);
    }

    if (this.move_down){
      this.current_shape.drop(this.table);
    }
  }
}
