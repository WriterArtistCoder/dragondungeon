import { Schema, type } from "@colyseus/schema";

export class CoinJar extends Schema {

	@type("number")
	x: number = 0;

	@type("number")
	y: number = 0;

	@type("number")
	team: number = 0;

	constructor(x: number, y: number) {
		super()
		this.x = x;
		this.y = y;
	}

	checkHit(dragonX: number, dragonY: number, teamNum: number) {
		if( teamNum == this.team && !(teamNum == 0 && this.team == 0) ){return false;}
		if (Math.sqrt(Math.pow(this.x - dragonX, 2) + Math.pow(this.y - dragonY, 2)) < 95) {
			return true;
		} else {
			return false
		}
	}

}