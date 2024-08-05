import {ROWS, COLS, BLOCK_SIZE} from "./settings.js";

export function render_table(table, ctx, textures){
  let table_offset = 25;
  ctx.fillStyle = 'rgb(38, 48, 57)';
  ctx.globalAlpha = 1;
  ctx.fillRect(table_offset, table_offset, ROWS * BLOCK_SIZE, COLS * BLOCK_SIZE);

  for (let i = 0; i < ROWS * COLS; i++){
    if (table[i] == 0) continue;

    let x = Math.floor(i / ROWS);
    let y = (i % (ROWS));

    ctx.drawImage(
      textures, 
      ((table[i] - 1) % 7) * 64, 
      0,
      64,
      64, 
      y * BLOCK_SIZE + table_offset,
      x * BLOCK_SIZE + table_offset,
      BLOCK_SIZE,
      BLOCK_SIZE
    );
  }
}


// for debug mode 
export function draw_table(table, ctx){
  ctx.fillStyle = 'black';
  ctx.globalAlpha = 1;
  let table_offset = 25;
  let font_offset = table_offset + 10;
  const colors = ['red', 'blue','green', 'yellow', 'purple', 'orange', 'pink'];

  for (let i = 0; i < ROWS * COLS; i++){
    let y = Math.floor(i / ROWS) * BLOCK_SIZE;
    let x = (i % (ROWS)) * BLOCK_SIZE;

    if (table[i] != 0){
      ctx.fillStyle = colors[(table[i] - 1) % 7];
      ctx.globalAlpha = 0.7;
      ctx.fillRect(x + table_offset, y + table_offset, BLOCK_SIZE, BLOCK_SIZE);
    }

    ctx.fillStyle = 'black';
    ctx.globalAlpha = 1;
    ctx.strokeRect(x + table_offset, y + table_offset, BLOCK_SIZE, BLOCK_SIZE);
    ctx.fillText(table[i], x + font_offset - 2.5, y + font_offset + 5); // cell value

    if (y / BLOCK_SIZE == 0){
      ctx.fillText(i, x + font_offset, y + table_offset - 5); // ROWS
    }

    if (x / BLOCK_SIZE == 0){
      ctx.fillText(i / 10, x + table_offset - 15, y + font_offset + 5); // COLS
    }
  }
}


export function clear_row(table, curr_shape_blocks){
  let last_cleared_row = -1;
  curr_shape_blocks.forEach((block) => {
    for (let y = 0; y < ROWS; y++){
      if (table[block.x * ROWS + y] == 0) return;  
    }

    for (let y = 0; y < ROWS; y++){
      table[block.x * ROWS + y] = 0; 
    }

    last_cleared_row = block.x;
  });

  return last_cleared_row;
}


export function drop_previous_shapes(table, last_cleared_row){
  const table_copy = [];
  for (let i = 0; i < ROWS * COLS; i++){
    table_copy[i] = table[i];
  }

  for (let i = 0; i < ROWS * COLS; i++){
    let y = Math.floor(i / ROWS);

    if (y >= last_cleared_row) break; 
    table[i] = 0;
  }

  // 'i' starts looping from last item in the row above 'last_cleared_row'
  for (let i = (last_cleared_row - 1) * ROWS + ROWS - 1; i > 0; i--){
    let x = i % ROWS;
    let y = Math.floor(i / ROWS);
    let curr_block_tv = table_copy[i];

    if (curr_block_tv != 0){
      let y_offset = 1;

      for (; y_offset < COLS ; y_offset++){
        let cell_below = table[(y + y_offset) * ROWS + x];

        if (cell_below != 0 || cell_below === undefined) {
          break;
        }
      }
      table[(y + y_offset - 1) * ROWS + x] = curr_block_tv;
    }
  }
}


export function clear_matrix(matrix){
  for (let i = 0; i < 9; i++){
    let x = i % 3;
    let y = Math.floor(i / 3);
    matrix[x][y] = 0;
  }
}



// function cl(block, table, then){
  // id = requestAnimationFrame(() => {
    // cl(block, table, then);
  // });

  // let y = 0;

  // for (; y < ROWS; y++){
    // if (table[block.x * ROWS + y] != 0) break;
  // }

  // for (; y < ROWS; y++){
    // let now = Date.now();
    // let elapsed = now - then;

    // if (elapsed >= 18){
      // then = now - (elapsed % 18);

      // table[block.x * ROWS + y] = 0; 

      // if (table[block.x * ROWS + y] == 0 && y == ROWS - 1) {
        // cancelAnimationFrame(id);
      // } 
    // }
  // }
// }
