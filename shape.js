import {ROWS, BLOCK_SIZE, SHAPE_TYPES} from "./settings.js";


export class Block {
  constructor(x, y, color){
    this.x = x;
    this.y = y;
    this.color = color; 
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
    this.type = type;
    this.color = color;

    let blocks_and_mats = Shape.new_blocks_from_type(type, color, cbx, cby);
    this.blocks = blocks_and_mats[0];
    this.rot_matrices = blocks_and_mats[1]; // contains matrices for both clockwise (1st half) and counter clockwise (2nd half)
    
    this.docked = false;
    this.table_value = table_value;
    this.rot_state = 2;

    this.move_left = false;
    this.move_right = false;
    this.allow_rot = false;
  }

  static rot(matrix){
    let l = 0;
    let r = matrix.length - 1;

    while (l < r){
      for (let i = 0; i < r - l; i++){
        let _top = l; // top is a regular keyword
        let bot = r;

        let top_l = matrix[_top][l + i];
        matrix[_top][l + i] = matrix[bot - i][l];
        matrix[bot - i][l] = matrix[bot][ r - i];
        matrix[bot][r - i] = matrix[_top + i][r];
        matrix[_top + i][r] = top_l;
      }   
      r--;
      l++;
    }
    console.table(matrix);
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


  rotate(table, ctx, clockwise = true){
    if (this.type == 'O') return; 

    if (this.type == 'I') {
      this.unload_from_table(table);

      let cb = this.blocks[2];
      let new_y, new_x;

      switch(this.rot_state){
        case 1:
          new_x = cb.x - 1;
          new_y = cb.y - 1;
          break;
        case 2:
          new_y = cb.y;
          new_x = cb.x - 1; 
          break;
        case 3:
          new_x = cb.x;
          new_y = cb.y - 2;
          break;
        case 4:
          new_y = cb.y - 1;
          new_x = cb.x - 2;
          break;
      }  

      for (let b of this.blocks){
        b.x = new_x;
        b.y = new_y;

        if (this.rot_state == 1 || this.rot_state == 3) new_y++;
        else new_x++;
      }
      
      this.rot_state = this.rot_state < 4 ? this.rot_state +1 : 1;
      this.load_on_table(table);
      return;
    }

    let matrix_size  = 9; 
    let matrix_width = 3;
    let matrix_start = (this.rot_state - 1) * matrix_size + (clockwise ? 0 : matrix_size * 4);
    let rot_matrix = this.rot_matrices.substring(matrix_start, matrix_start + matrix_size);

    this.unload_from_table(table);

    let cb_idx = this.rot_state < 3 ? 1 : 2;
    const cb = this.blocks.splice(cb_idx, 1)[0]; 
    let block_idx = 0;

    for (let i = 0; i < matrix_size; i++){
      if (rot_matrix[i] == '1'){
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

    this.rot_state = this.rot_state < 4 ? this.rot_state + 1 : 1;
    this.blocks.splice( this.rot_state < 3 ? 1 : 2, 0, cb);
    this.load_on_table(table);
  }

  
  // DON'T TOUCH THE STRINGS
  static new_blocks_from_type(type, color, cbx, cby){
    switch(type){
      case 'I':
        return [
          [
            new Block(cbx, cby - 1, this.color),
            new Block(cbx, cby, this.color),
            new Block(cbx, cby + 1, this.color),
            new Block(cbx, cby + 2, this.color),
          ],

           '01000100010001000000111100000000001000100010001000000000111100000100010001000100000000001111000000100010001000100000111100000000'
        ];

      case 'J':
        return [
          [
            new Block(cbx, cby - 1, color),
            new Block(cbx, cby, color),
            new Block(cbx, cby + 1, color),
            new Block(cbx + 1, cby + 1, color),
          ],

          // '010010110100111000011010010000111001',
          // '010010110000111001011010010100111000'
          '010010110100111000011010010000111001010010110000111001011010010100111000'
        ];

      case 'L':
         return [
           [
             new Block(cbx, cby + 1, this.color),
             new Block(cbx, cby, this.color),
             new Block(cbx, cby - 1, this.color), 
             new Block(cbx + 1 , cby - 1, this.color),
           ],

           '010010011000111100110010010001111000010010011001111000110010010000111100',
         ];

      case 'O':
        return [ 
          [
            new Block(cbx, cby + 1, this.color),
            new Block(cbx, cby, this.color),
            new Block(cbx + 1, cby, this.color), 
            new Block(cbx + 1 , cby + 1, this.color),
          ],

          '' // no need to rotate the square 
        ];

      case 'S':
        return [ 
          [

            new Block(cbx, cby + 1, this.color),
            new Block(cbx, cby, this.color),
            new Block(cbx + 1 , cby, this.color), 
            new Block(cbx + 1 , cby - 1, this.color),
          ],

           '011110000010011001000011110100110010011110000100110010000011110010011001'
        ];

      case 'Z':
        return [
          [
            new Block(cbx, cby - 1, this.color),
            new Block(cbx, cby, this.color),
            new Block(cbx + 1 , cby, this.color), 
            new Block(cbx + 1 , cby + 1, this.color),
          ],

          '110011000001011010000110011010110100110011000010110100000110011001011010'
        ];
        break;

      case 'T':
        return [
          [
            new Block(cbx - 1, cby, this.color),
            new Block(cbx, cby, this.color),
            new Block(cbx, cby - 1, this.color), 
            new Block(cbx, cby + 1, this.color),
          ],
          '010111000010011010000111010010110010010111000010110010000111010010011010'
        ];
        break;
    }
  }
}
