import {ROWS, COLS, BLOCK_SIZE, SHAPE_TYPES} from "./settings.js";

export class Block {
  constructor(x, y){
    this.x = x;
    this.y = y;
  }

  get_table_value(table, x_offset = 0, y_offset = 0){
    return table[(this.x + x_offset) * ROWS + (this.y + y_offset)];
  }

  in_hor_boundaries(){
    return this.y > 0 && this.y < ROWS - 1;
  }
}


export class Shape {
  constructor(type, color, cbx, cby, table_value){
    this.type = type;
    this.rot_matrices = Shape.rot_matrices_from_type(type);
    this.rot_state = type != 'I'? 0 : 1; // 4 states: 0...3
    this.blocks = Shape.new_blocks_from_type(type, this.rot_state, cbx, cby);
    this.docked = false;
    this.table_value = table_value;
  }

  static new_rand(curr_shape_num){
    return new Shape(
      SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
      curr_shape_num % 7,
      1,
      Math.floor(Math.random() * (ROWS - 3 - 3 + 1)) + 3,
      curr_shape_num,
    ); 
  }

  get_lowest_block(){
    let lowest = this.blocks[0]; 
    this.blocks.forEach((block) => {
      if (block.x > lowest.x) lowest = block;
    });

    return lowest;
  }

  get_most_hor_block(left){
    // left? true -> left-most block : false right-most block
    let most_hor = this.blocks[0]; 
   
    this.blocks.forEach((block) => {
      if (left){
        if (block.y < most_hor.y) most_hor = block;
      } else {
        if (block.y > most_hor.y) most_hor = block;
      }
    });

    return most_hor;
  }
  
  load_on_table(table){
    this.blocks.forEach((block) => {
      table[block.x * ROWS + block.y] = this.table_value;
    });
  }

  unload_from_table(table){
    this.blocks.forEach((block) => {
      table[block.x * ROWS + block.y ] = 0;
    });
  }

  can_drop(next_cell){
    // undefined -> shape has reached the bottom
    return (next_cell === 0 || next_cell == this.table_value) && next_cell !== undefined;
  }


  move_hor(left, table){
    if (this.docked) return;

    let y_offset = left? -1 : 1;
    let most_hor_block = this.get_most_hor_block(left);
    let idx_new_most_hor_block = most_hor_block.x  * ROWS + (most_hor_block.y + y_offset);

    // don't move the shape if the offset brings to a new row
    if (Math.floor(idx_new_most_hor_block / ROWS) !== most_hor_block.x) {
      return;
    }

    for (let i = 0; i < this.blocks.length; i++){
      let block = this.blocks[i];

      if (!this.can_drop(block.get_table_value(table, 0, y_offset))){
        return;
      }
    }

    this.unload_from_table(table);
    this.blocks.forEach((block)=> block.y += y_offset);
    this.load_on_table(table);
  }


  drop(table){
    if (this.docked) return;

    if (!this.can_drop(this.get_lowest_block().get_table_value(table, 1, 0))) {
      this.docked = true;
      return;
    }

    for (let i = 0; i < this.blocks.length; i++){
      let block = this.blocks[i];
      if (!this.can_drop(block.get_table_value(table, 1, 0))){
        this.docked = true;
        return;
      }
    }

    this.blocks.forEach((block)=> {
      table[block.x * ROWS + block.y] = 0;
      block.x += 1;
    });
    // shape needs to be re-uploaded seperately or vertically
    // adjacent blocks won't be uploaded correctly
    this.load_on_table(table);
  }

  get_next_rot_state(clockwise){
    return !clockwise ? 
      (this.rot_state > 0 ? this.rot_state - 1 : 3): 
      (this.rot_state < 3 ? this.rot_state + 1 : 0);
  }


  // not working 
  handle_rot_next_to_hor_bounds(next_rot_state, center_block_y){
    if (this.type == 'I' && (next_rot_state == 1 || next_rot_state == 3)){
      if (center_block_y == 0) return center_block_y + 2;
      if (center_block_y == ROWS - 1) return center_block_y - 2;
    }

    if (center_block_y == 0) return center_block_y + 1;
    if (center_block_y == ROWS - 1) return center_block_y - 1;

    return center_block_y;
  }

  rotate(table, ctx, clockwise){
    /* Based on the rototion state and the shape, it uses one of the shape's block 
     * as an 'anchor point'. for 'I' shape : 2nd block, 
     * other shapes : either the 2nd or the 3rd, depending on the rot_state.
      *
      * From there it loops through the rotation matrix and uses the coordinates of an 
      * occupied cell as offset from the matrix's center block to determine the 
      * blocks's new positions. The offset will be then added to the center block. */

    if (this.type == 'O') return;
    
    // the 'I' shape needs a 4x4 matrix
    let matrix_size  = this.type == 'I' ? 16 : 9; 
    let matrix_width = this.type == 'I' ? 4 : 3;
    let next_rot_state = this.get_next_rot_state(clockwise);
    let matrix_start = next_rot_state * matrix_size;
    this.unload_from_table(table);

    let center_block_idx = this.type == 'I' ? 
      this.rot_state < 2 ? 1 : 2 : 
      this.rot_state < 2 ? 2 : 1;
    let center_block_x = this.blocks[center_block_idx].x;
    let center_block_y = this.handle_rot_next_to_hor_bounds(
      next_rot_state, this.blocks[center_block_idx].y
    );

    // make sure the 'I' shape won't go away while rotating, i'll fix it later 
    if (this.type == 'I'){
      if (clockwise && (next_rot_state == 3 || next_rot_state == 0)
        || !clockwise && (next_rot_state == 2 || next_rot_state == 1)){
        center_block_y--;
        center_block_x--;
      }
    }

    let new_center_block_idx;
    let curr_block_idx = 0;
    for (let i = 0; i < matrix_size; i++){
      if (this.rot_matrices[matrix_start + i] == '1'){
        let matrix_row = Math.floor(i / matrix_width);
        let matrix_col = i % matrix_width;

        if (this.type != 'I' && matrix_row == 1 && matrix_col == 1){
          new_center_block_idx = curr_block_idx; 
        }

        this.blocks[curr_block_idx].x = center_block_x + matrix_row - 1;
        this.blocks[curr_block_idx].y = center_block_y + matrix_col - 1;
        curr_block_idx++;
      }
    }
    // Put the center block in the right place 
    if (this.type != 'I'){
      const new_center_block = this.blocks[new_center_block_idx];
      this.blocks[new_center_block_idx] = this.blocks[next_rot_state < 2 ? 2 : 1];
      this.blocks[next_rot_state < 2 ? 2 : 1] = new_center_block;
    }
    this.rot_state = next_rot_state;
    this.load_on_table(table);
  }
  

  static rot_matrices_from_type(type){
    // DO NOT TOUCH THE STRINGS!!!!!!!
    switch(type){
      case 'I': return '0100010001000100000011110000000000100010001000100000000011110000';
      case 'O': return '110110000';
      case 'J': return '100111000011010010000111001010010110';
      case 'L': return '001111000010010011000111100110010010';
      case 'S': return '010011001000011110100110010011110000';
      case 'Z': return '110011000001011010000110011010110100'; 
      case 'T': return '010111000010011010000111010010110010';
      default:
        throw new Error(`Shape type '${type}' is not valid`);
    }
  }

  static new_blocks_from_type(type, rot_state, cbx, cby){
    let matrix_size  = type == 'I' ? 16 : 9; 
    let matrix_width = type == 'I' ? 4 : 3;
    let matrix_start = rot_state * matrix_size;
    let rot_matrices = Shape.rot_matrices_from_type(type);

    const blocks = [];
    for (let i = 0; i < matrix_size; i++){
      if (rot_matrices[matrix_start + i] == '1'){
        let matrix_row = Math.floor(i / matrix_width); 
        let matrix_col = i % matrix_width; 

        let new_block = new Block(0, 0);
        new_block.x = cbx + matrix_row - 1;
        new_block.y = cby + matrix_col - 1;

        blocks.push(new_block);
      }
    }
    return blocks;
  }
}

















