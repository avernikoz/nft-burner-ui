export function scGetCommonFuncsDeclarations()
{
	return (/* glsl */`
	
	float MapToRange(float t, float t0, float t1, float newt0, float newt1)
	{
		///Translate to origin, scale by ranges ratio, translate to new position
		return (t - t0) * ((newt1 - newt0) / (t1 - t0)) + newt0;
	}
	
	`);
}