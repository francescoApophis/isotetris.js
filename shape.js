import {ROWS, BLOCK_SIZE, SHAPE_TYPES} from "./settings.js";


export class Block {
  constructor(x, y, color){
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
  static new_rand(curr_shape_num){
    return new Shape(
      SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
      curr_shape_num % 7,
      1,
      Math.floor(Math.random() * (ROWS - 3 - 3 + 1)) + 3,
      curr_shape_num,
    ); 
  }

  constructor(type, color, cbx, cby, table_value){
    this.type = type.toLowerCase();
    this.rot_matrices = Shape.rot_matrices_from_type(this.type);
    this.rot_state = 0; // 4 states: 0...3
    this.blocks = Shape.new_blocks_from_type(type, this.rot_state, cbx, cby);
    this.docked = false;
    this.table_value = table_value;
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
    let mhb = this.get_most_hor_block(left);

    if (!(this.can_drop(mhb.get_table_value(table, 0, y_offset)) && mhb.in_hor_boundaries())){
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


  rotate(table, ctx, clockwise = true){
    if (this.type == 'O') return; 

    this.unload_from_table(table);

    if (this.type == 'i') {
      let cb = this.blocks[2];
      let new_y, new_x;

      // keep shape inside borders when rotating next to borders
      if (cb.y == 0) cb.y++;
      else if (cb.y == ROWS - 1) cb.y -= 1; 

      switch(this.rot_state){
        case 0:
          new_x = cb.x - 1;
          new_y = cb.y - 1;
          break;
        case 1:
          new_y = cb.y;
          new_x = cb.x - 1; 
          break;
        case 2:
          new_x = cb.x;
          new_y = cb.y - 2;
          break;
        case 3:
          new_y = cb.y - 1;
          new_x = cb.x - 2;
          break;
      }  

      for (let b of this.blocks){
        b.x = new_x;
        b.y = new_y;
        if (this.rot_state == 0 || this.rot_state == 2) new_y++;
        else new_x++;
      }
      
      this.rot_state = this.get_next_rot_state(clockwise);
      this.load_on_table(table);
      return;
    }

    let matrix_size  = 9; 
    let matrix_width = 3;
    let next_rot_state = this.get_next_rot_state(clockwise);
    let matrix_start = next_rot_state * matrix_size;

    let cb_idx = this.rot_state < 2 ? 2 : 1;
    const cb = this.blocks.splice(cb_idx, 1)[0]; 
    let block_idx = 0;

    let smaller_block_size = BLOCK_SIZE - 5;


    // keep shape inside borders when rotating next to borders
    if (cb.y == 0) cb.y ++;
    else if (cb.y == ROWS - 1) cb.y--; 

    for (let i = 0; i < matrix_size; i++){
      if (this.rot_matrices[matrix_start + i] == '1'){
        let row = Math.floor(i / matrix_width); 
        let col = i % matrix_width; 

        if (row == 1 && col == 1) continue;

        if (row == 0) this.blocks[block_idx].x = cb.x - 1;
        else if (row == 1) this.blocks[block_idx].x = cb.x;
        else this.blocks[block_idx].x = cb.x + 1;
        
        if (col == 0) this.blocks[block_idx].y = cb.y - 1;
        else if (col == 1) this.blocks[block_idx].y = cb.y;
        else this.blocks[block_idx].y = cb.y + 1;
        block_idx++;
      }
    }

    this.rot_state = next_rot_state;
    this.blocks.splice(this.rot_state < 2 ? 2 : 1, 0, cb);
    this.load_on_table(table);
  }

  static rot_matrices_from_type(type){
    switch(type){
      case 'o':
        return '110110000';
      case 'i':
        return '0100010001000100000011110000000000100010001000100000000011110000';
      case 'j':
        return '100111000011010010000111001010010110';
      case 'l':
        return '001111000010010011000111100110010010';
      case 's':
        return '010011001000011110100110010011110000';
      case 'z':
        return '110011000001011010000110011010110100'; 
      case 't':
        return '010111000010011010000111010010110010';
      default:
        throw new Error(`Shape type '${type}' is not valid`);
    }
  }


  static new_blocks_from_type(type, rot_state, cbx, cby){
    type = type.toLowerCase();
    let matrix_size  = type == 'i' ? 16 : 9; 
    let matrix_width = type == 'i' ? 4 : 3;
    let matrix_start = rot_state * matrix_size;
    let rot_matrices = Shape.rot_matrices_from_type(type);

    const blocks = [];
    for (let i = 0; i < matrix_size; i++){
      if (rot_matrices[matrix_start + i] == '1'){
        let row = Math.floor(i / matrix_width); 
        let col = i % matrix_width; 

        let new_block = new Block(0, 0);

        if (row == 0)  new_block.x = cbx - 1;
        else if (row == 1) new_block.x = cbx;
        else if (type == 'i' && row == 2) new_block.x = cbx + 2;
        else new_block.x = cbx + 1;
        
        if (col == 0) new_block.y = cby - 1;
        else if (col == 1) new_block.y = cby;
        else if (type == 'i' && col == 2) new_block.y = cby + 2;
        else new_block.y = cby + 1;

        blocks.push(new_block);
      }
    }
    return blocks;
  }
}
