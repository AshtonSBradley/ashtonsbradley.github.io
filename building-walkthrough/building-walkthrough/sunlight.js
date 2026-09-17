// User-confirmed approximate north-east source across all north-up plans.
// World +x is east; -z is north. Elevation is illustrative, not date-calculated.
export const SUN_ELEVATION_DEGREES=25;
export function positionNorthEastSun(light,x,p){
 light.target.position.set(x,0,-p);
 light.position.set(x+18,Math.tan(SUN_ELEVATION_DEGREES*Math.PI/180)*18*Math.SQRT2,-p-18);
 light.name='Direct sunlight from north-east (illustrative 25 degrees)';
}
