
export class Texture {
  constructor(path, crop_w, crop_h){
    // in drawImage() I have to use Texture.img
    this.img = new Image();
    this.img.src = path;
    this.crop_w = crop_w;
    this.crop_h = crop_h;
  }
}

export class IsoBlockTexture extends Texture {
  constructor (path, crop_width, crop_height, tlm_vertex, resize){
    super(path, crop_width, crop_height)
    this.tlm_vertex = tlm_vertex; // Top Left Most vertex of the block
    this.resize = resize; // iso images are much bigger so they need to be scaled down
  }
}


