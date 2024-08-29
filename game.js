import {Shape} from "./shape.js";
import {FPS, FPS_INTERVAL, LEVEL_FPS, LEVEL_FPS_INTERVAL, C_W, C_H, ROWS, COLS, BLOCK_SIZE, DEBUG_FONT, DEBUG_FONT_SIZE, PAUSE_FONT, PAUSE_FONT_SIZE} from "./settings.js";


export class Game {
  constructor(ctx, canvas, pixel_art_txr, isometric_txr, ctx2 = undefined, ctx3 = undefined){
    this.ctx = ctx;
    // this two ctxs are for debugging the table at different states at the same time
    this.ctx2 = ctx2; 
    this.ctx3 = ctx3;
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
    this.shapes_log = [];
    this.table = [...Array(ROWS * COLS)].map(() => {
      return 0;
    });


    // this.table = [
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,10,10,10,10,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
      // 0,0,0,0,0,0,0,0,0,0,
    // ];
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

    if (this.debug_mode) {
      this.render_debug_mode(this.ctx);
    } else if (this.iso_mode) {
      this.render_isometric_mode();
    } else {
      this.render_pixel_art_mode();
    }

    if (this.pause_game) {
      this.render_pause();
    }
  }


  render_debug_mode(ctx){
    ctx.font = `${DEBUG_FONT_SIZE}px ${DEBUG_FONT}`;
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 1;
    let table_offset = 25;
    let font_offset = table_offset + 10;
    let smaller_block_size = BLOCK_SIZE - 5;
    const colors = ['red', 'blue','green', 'yellow', 'purple', 'orange', 'pink'];

    for (let i = 0; i < ROWS * COLS; i++){
      let y = Math.floor(i / ROWS) * smaller_block_size;
      let x = (i % (ROWS)) * smaller_block_size;

      if (this.table[i] != 0){
        ctx.fillStyle = colors[(this.table[i] - 1) % 7];
        ctx.fillRect(x + table_offset, y + table_offset, smaller_block_size, smaller_block_size);
      }

      ctx.fillStyle = 'black';
      ctx.strokeRect(x + table_offset, y + table_offset, smaller_block_size, smaller_block_size);
      ctx.fillText(this.table[i], x + font_offset - 2.5, y + font_offset + 5); // cell value

      if (y / smaller_block_size == 0){
        ctx.fillText(i, x + font_offset, y + table_offset - 5); // ROWS
      }

      if (x / smaller_block_size == 0){
        ctx.fillText(i / 10, x + table_offset - 15, y + font_offset + 5); // COLS
      }
    }
  }

  render_isometric_mode(){
    this.ctx.fillStyle = '#6f54b8';
    this.ctx.globalAlpha = 1;
    this.ctx.fillRect(0, 0, 250, 550);

    let rows = COLS;
    let cols = ROWS;

    // Isometric Block iso-asset3.png
    // let ib_width = 243; 
    // let ib_height = 282;
    // let ib_top_left_vertex = 69;
    // let res = 6;
    //

    let iso_block_img_width = 250; 
    let iso_block_img_height = 300;
    let iso_block_img_top_left_vertex = 70;
    let res = 7;

    for (let x = rows; x >= 0; x--){
      for (let y = 0; y < cols; y++){
        let cell = this.table[x * cols + y];

        if ( cell == 0 || cell === undefined) continue;

        this.ctx.drawImage(
          this.isometric_txr,
          ((cell - 1) % 7) * iso_block_img_width, 
          0,
          iso_block_img_width, 
          iso_block_img_height,
          y * (iso_block_img_width / 2) / res + 25,
          (x * (iso_block_img_height / 2) + iso_block_img_top_left_vertex * y) / res - 40,
          iso_block_img_width / res,
          iso_block_img_height / res,
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
        y * BLOCK_SIZE,
        x * BLOCK_SIZE,
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
    let font_size = 25;
    this.ctx.fillStyle = 'rgba(0,0,0, 0.2)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.font = `${PAUSE_FONT_SIZE}px ${DEBUG_FONT}`;
    this.ctx.fillText('Pause', C_W / 2 - 25 * 5 * 0.25 , C_H / 2);
  }

  clear_row(){
    let highest_cleared_row = -1;
    let cleared_rows_num = 0;

    this.current_shape.blocks.forEach((block) => {
      for (let y = 0; y < ROWS; y++){
        if (this.table[block.x * ROWS + y] == 0) return;  
      }

      for (let y = 0; y < ROWS; y++){
        this.table[block.x * ROWS + y] = 0; 
      }

      cleared_rows_num += 1;
      if (highest_cleared_row === -1 || block.x < highest_cleared_row){
        highest_cleared_row = block.x;
      }
    });
    return [highest_cleared_row, cleared_rows_num]; 
  }

  drop_previous_shapes(highest_cleared_row, cleared_rows_num){
    for (let i = (highest_cleared_row - 1) * ROWS + ROWS - 1; i > 0; i--){
      let row = Math.floor(i / ROWS);
      let col = i % ROWS;
      let curr_table_value = this.table[i];
      let x_offset = cleared_rows_num;
      this.table[i] = 0;

      for (let j = 0; j < cleared_rows_num; ++j){
        if (this.table[(row + x_offset) * ROWS + col] === undefined){
          x_offset--;
        } else{
          break;
        }
      }
      this.table[(row + x_offset) * ROWS + col] = curr_table_value;
    }
  }


  handle_shape_docking(){
    if (this.current_shape.docked){
      let [highest_cleared_row, cleared_rows_num] = this.clear_row();;

      if (highest_cleared_row !== -1) {
        this.drop_previous_shapes(highest_cleared_row, cleared_rows_num);
      }

      this.current_shape_num++;
      this.shapes_log.push(this.current_shape);
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
