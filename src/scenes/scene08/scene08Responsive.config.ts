// ============================================
// SCENE 08 RESPONSIVE CONFIG
// ============================================
//
// Scene08 uses ONE fixed design stage.
//
// DESIGN SIZE = 1600 x 900
// ASPECT RATIO = 16 : 9
//
// The entire design is scaled proportionally
// to fit the ACTUAL available container.
//
// No phone/tablet-specific positions.
// Everything keeps the same relative position.
// ============================================

export const SCENE08_DESIGN_WIDTH = 1600;

export const SCENE08_DESIGN_HEIGHT = 900;

export const SCENE08_ASPECT_RATIO =
  SCENE08_DESIGN_WIDTH /
  SCENE08_DESIGN_HEIGHT;


// ============================================
// SIZE TYPE
// ============================================

export interface Scene08Size {
  width: number;
  height: number;
}


// ============================================
// GET 16:9 STAGE SIZE
// ============================================
//
// This function receives the ACTUAL available
// width and height.
//
// It returns the largest possible 16:9 stage
// that fits completely inside that area.
//
// Example:
//
// 1024 x 768
// → 1024 x 576
//
// 844 x 390
// → 693.33 x 390
//
// 1920 x 1080
// → 1920 x 1080
//
// ============================================

export const getScene08StageSize = (
  availableWidth: number,
  availableHeight: number
): Scene08Size => {

  if (
    availableWidth <= 0 ||
    availableHeight <= 0
  ) {

    return {
      width: 0,
      height: 0,
    };

  }


  const widthFromHeight =
    availableHeight *
    SCENE08_ASPECT_RATIO;


  const heightFromWidth =
    availableWidth /
    SCENE08_ASPECT_RATIO;


  // ==========================================
  // HEIGHT IS THE LIMIT
  // ==========================================

  if (
    widthFromHeight <= availableWidth
  ) {

    return {

      width:
        widthFromHeight,

      height:
        availableHeight,

    };

  }


  // ==========================================
  // WIDTH IS THE LIMIT
  // ==========================================

  return {

    width:
      availableWidth,

    height:
      heightFromWidth,

  };

};


// ============================================
// GET SCALE
// ============================================
//
// Scale relative to the original
// 1600 x 900 design.
//
// ============================================

export const getScene08Scale = (
  availableWidth: number,
  availableHeight: number
): number => {

  const stage =
    getScene08StageSize(
      availableWidth,
      availableHeight
    );


  return (
    stage.width /
    SCENE08_DESIGN_WIDTH
  );

};


// ============================================
// CSS VARIABLES
// ============================================

export const getScene08CssVariables = (
  availableWidth: number,
  availableHeight: number
) => {

  const stage =
    getScene08StageSize(
      availableWidth,
      availableHeight
    );


  const scale =
    stage.width /
    SCENE08_DESIGN_WIDTH;


  return {

    '--scene08-width':
      `${stage.width}px`,

    '--scene08-height':
      `${stage.height}px`,

    '--scene08-scale':
      `${scale}`,

  };

};