import {Shape} from "./shape.js";
import {FPS, FPS_INTERVAL, LEVEL_FPS, LEVEL_FPS_INTERVAL, C_W, C_H, ROWS, COLS, BLOCK_SIZE} from "./settings.js";
import {draw_table, render_table, clear_matrix, clear_row, drop_previous_shapes} from "./utils.js";


const canvas = document.getElementById('canvas');
const canvas2 = document.getElementById('canvas2');
const ctx = canvas.getContext('2d');
const ctx2 = canvas2.getContext('2d');

const textures = new Image();
textures.src = "./assets/square2.png";

let now, then, start_time, elapsed;
let pause = false;
let level_now, level_then, level_start_time, level_elapsed;

const debug_btn = document.getElementById('debug_btn');
let debug_mode = true;
debug_btn.onclick = () => debug_mode = !debug_mode;

const table = [...Array(ROWS * COLS)].map(() => {
    return 0;
});

const matrix = [...Array(3)].map(() => {
  return [...Array(3)].map(() => {
    return 0;
  });
});

let curr_shape_num = 1;
let curr_shape;



function start_animation(){
  then = Date.now();
  start_time = then;
  level_then = then;
  level_start_time = level_then;

  curr_shape = Shape.new_rand(curr_shape_num);
  curr_shape.load_on_table(table);
  animate();
}

function animate(){
  requestAnimationFrame(animate);
  now = Date.now();
  elapsed = now - then;
  level_now = Date.now();
  level_elapsed = level_now - level_then;

  if (elapsed > FPS_INTERVAL){
    then = now - (elapsed % FPS_INTERVAL);
    
    if (pause){
      ctx.clearRect(BLOCK_SIZE , COLS * BLOCK_SIZE + BLOCK_SIZE + 7, 150, 150);
      ctx.fillText('pause', BLOCK_SIZE * 2, COLS * BLOCK_SIZE + 2 * BLOCK_SIZE);
      return;
    }

    ctx.clearRect(0, 0, C_W, C_H);
    ctx.fillText('play', BLOCK_SIZE * 2, COLS * BLOCK_SIZE + 2 * BLOCK_SIZE);

    debug_mode ? draw_table(table, ctx) : render_table(table, ctx, textures);

    if (curr_shape.allow_rot){
      curr_shape.rotate(table, ctx, true);
      curr_shape.allow_rot = false;
    }

    if (curr_shape.move_left){
      curr_shape.move_hor(true, table);
    }
    
    if (curr_shape.move_right){
      curr_shape.move_hor(false, table);
    }

    if (curr_shape.docked){
      let last_cleared_row = clear_row(table, curr_shape.blocks, then);

      if (last_cleared_row !== -1) {
        drop_previous_shapes(table, last_cleared_row);
      }

      curr_shape_num++;
      curr_shape = Shape.new_rand(curr_shape_num);
    }
  }

  if (level_elapsed > LEVEL_FPS_INTERVAL){
    level_then = level_now - (level_elapsed % LEVEL_FPS_INTERVAL);

    if (!pause) curr_shape.drop(table);
  }
}




// const matrix_2 = [
  // [0, 1, 0], 
  // [0, 1, 0], 
  // [1, 1, 0], 
// ];


document.addEventListener('keydown', (e)=>{
  switch(e.key){
    case ' ': 
      pause = !pause;
      break;
    case 'r':
      curr_shape.allow_rot = true;
      break;

    case 's':
      curr_shape.drop(table);
      break;
    case 'a':
      curr_shape.move_left = true;
      break;
    case 'd':
      curr_shape.move_right = true;
      break;
    case 'z':
      Shape.rot(matrix_2);
  }
})


document.addEventListener('keyup', (e)=>{
  switch(e.key){
    case 'a':
      curr_shape.move_left = false;
      break;
    case 'd':
      curr_shape.move_right= false;
      break;
  }
});


start_animation();
