import {Shape} from "./shape.js";
import {FPS, FPS_INTERVAL, LEVEL_FPS, LEVEL_FPS_INTERVAL, C_W, C_H, ROWS, COLS, BLOCK_SIZE} from "./settings.js";
import {Game} from "./game.js";
import {Texture, IsoBlockTexture} from "./utils.js"

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const textures = {
  pixel: new Texture('./assets/square2.png', 64, 64),
  iso3: new IsoBlockTexture('./assets/iso-assets3.png', 243, 282, 69, 6),
  iso4: new IsoBlockTexture('./assets/iso-assets4.png', 250, 300, 70, 7.5),
};

const game = new Game(ctx, canvas, textures);

const debug_btn = document.getElementById('debug_btn');
const iso_btn = document.getElementById('iso_btn');
debug_btn.onclick = () => game.debug_mode = !game.debug_mode;
iso_btn.onclick = () => game.iso_mode = !game.iso_mode;


game.start();

document.addEventListener('keydown', (e)=>{
  switch(e.key){
    case ' ': 
      game.pause_game = !game.pause_game;
      break;
    case 's':
      game.move_down =  true;
      break;
    case 'a':
      game.move_left = true;
      break;
    case 'd':
      game.move_right = true;
      break;
    case 'ArrowLeft':
      game.rotate_left = true;
      break;
    case 'ArrowRight':
      game.rotate_right = true;
      break;
  }
})

document.addEventListener('keyup', (e)=>{
  switch(e.key){
    case 's':
      game.move_down = false;
      break;
    case 'a':
      game.move_left = false;
      break;
    case 'd':
      game.move_right = false;
      break;

    case 'ArrowLeft':
      game.rotate_left = false;
      break;
    case 'ArrowRight':
      game.rotate_right = false;
      break;
  }
});

