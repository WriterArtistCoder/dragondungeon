import * as PIXI from "pixi.js";
import { CustomPIXIComponent } from "react-pixi-fiber";

interface BarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  score: number;
  zIndex?: number;
}

function propsEqual(oldProps: BarProps, newProps: BarProps) {
  return (
    oldProps.x === newProps.x &&
    oldProps.y === newProps.y &&
    oldProps.width === newProps.width &&
    oldProps.color === newProps.color &&
    oldProps.height === newProps.height &&
    oldProps.score === newProps.score
  );
}

export const Bar = CustomPIXIComponent<PIXI.Graphics, BarProps>(
  {
    customDisplayObject: (_) => new PIXI.Graphics(),
    customApplyProps: (instance, oldProps, newProps) => {
      if (!propsEqual(oldProps, newProps)) {
        if (newProps.zIndex) {
          instance.zIndex = newProps.zIndex;
        }
        instance.clear();
        instance.beginFill(.2);
        instance.drawRect(
          newProps.x,
          newProps.y,
          newProps.width,
          newProps.height
        );
        instance.beginFill(255);
        instance.drawRect(
          newProps.x+2,
          newProps.y,
          newProps.score,
          newProps.height-5
        );
        instance.endFill();
      }
    },
  },
  "Bar"
);