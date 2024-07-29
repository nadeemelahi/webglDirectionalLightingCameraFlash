/*
 * author: Nadeem Elahi
 * nadeem.elahi@gmail.com
 * nad@3deem.com
 * license: gpl v3
 */
"use strict"; 

var gl = ngl.get_gl() ,

	cw = ngl.get_cw() , 
	ch = ngl.get_ch() ,

	clr = [ 0.1 , 0.1 , 0.1 ] ,

	startIdx = 0 ,

	dimVec = 4 ,
	dimClr = 3 
;

ngl.configureDraw( clr , 0 , 0 , cw , ch );

var verts , vlen = 12 , vertsOrig = new Float32Array ( [

	-1.0  ,  -1.0  ,  0.0  ,  1.0  , // lft , btm
	 1.0  ,  -1.0  ,  0.0  ,  1.0  , // rgt , btm
	 1.0  ,   1.0  ,  0.0  ,  1.0  , // rgt , top

] ) ;

function setVerts ( verts ) {
	for ( var idx = 0 ; idx < vlen ; idx ++ ) {
		verts[idx] = vertsOrig[idx];
	}
}





// 3 x 3D(red,green,blue) colour channels 
var colours , clen = 9 , coloursOrig =  new Float32Array( [ 
		1.0 , 0.0 , 1.0 ,
		1.0 , 0.0 , 1.0 ,
		1.0 , 0.0 , 1.0 ,

] );

function setColours ( colours ) {
	for ( var idx = 0 ; idx < clen ; idx ++ ) {
		colours[idx] = coloursOrig[idx];
	}
}

var cnt = coloursOrig.length / 3;

function lightFactoring( colours , factor){
	var idx , lim = colours.length;

	for ( idx = 0 ; idx < lim ; idx ++ ) {

		colours[idx] *= factor;

	}
}

function calcLineVector( pt1 , pt2 , ln ){

	ln.x = pt2.x - pt1.x;
	ln.y = pt2.y - pt1.y;
	ln.z = pt2.z - pt1.z;

}

function crossProduct( av , bv , cv ){
	// v - vector
	// <cv> = <av> x <bv>
	//https://www.mathsisfun.com/algebra/vectors-cross-product.html
	//https://mathinsight.org/cross_product_formula
	cv.x = (av.y * bv.z) - (av.z * bv.y) ; 
	cv.y = (av.z * bv.x) - (av.x * bv.z) ; 
	cv.z = (av.x * bv.y) - (av.y * bv.x) ; 
}

function normalize( nrm ) {

	// denominator - magintude of vector <x,y,z>
	var den = Math.sqrt (
		nrm.x * nrm.x
		+ nrm.y * nrm.y
		+ nrm.z * nrm.z 
	) ;

	nrm.x /= den;
	nrm.y /= den;
	nrm.z /= den;

}

function calcNormal(verts , nrm){

	// https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal

	var pt1 = {} ,
		pt2  = {} , 
		pt3  = {} , 
		ln1  = {} ,
		ln2 = {} 
	;

	pt1.x = verts[0];
	pt1.y = verts[1];
	pt1.z = verts[2];

	pt2.x = verts[4];
	pt2.y = verts[5];
	pt2.z = verts[6];

	pt3.x = verts[8];
	pt3.y = verts[9];
	pt3.z = verts[10];

	//console.log( pt1.x , pt1.y , pt1.z ); console.log( pt2.x , pt2.y , pt2.z ); console.log( pt3.x , pt3.y , pt3.z );

	calcLineVector( pt1 , pt2 , ln1 );
	//console.log( ln1.x , ln1.y , ln1.z );

	calcLineVector( pt1 , pt3 , ln2 );
	//console.log( ln2.y , ln2.y , ln2.z );

	//console.log("----");

	crossProduct( ln1 , ln2 , nrm );
	//console.log(nrm.x , nrm.y , nrm.z );

	//console.log("----");
	normalize( nrm );
	//console.log(nrm.x , nrm.y , nrm.z );
}

function dotProduct( norm , light ) {
	// norm - normal vector of face(3pt triangle)
	// light - directional lighting
	// cos(angle) or factor 
	//  - scalar result of dot product (norm dot light)

	// a . b = |a| |b| cos 
	//
	// a . b = a.x * b.x 
	//       + a.y * b.y 
	//	 + a.z * b.z
	//
	// cos = a . b / ( |a| |b| )

	// https://www.mathsisfun.com/algebra/vectors-dot-product.html
	// we want to the cos a value
	// so we need magnitudes of |norm| and |light|

	var magNorm = Math.sqrt (
		norm.x * norm.x
		+ norm.y * norm.y
		+ norm.z * norm.z
	);

	var magLight = Math.sqrt (
		light.x * light.x
		+ light.y * light.y
		+ light.z * light.z
	);

	var mag = magNorm * magLight;

	var dotp = norm.x * light.x
		+ norm.y * light.y
		+ norm.z * light.z 
	;

	// cos ( angle )
	var factor = dotp / mag;

	return factor;
	
}

// directional lighting, 
// straight on camera flash light, 
// into the page, ie) -z, or <0,0,-1>
var dlight = { x: 0 , y: 0 , z: 1} ,
	minLight = 0.2 ,
	lightFactor ;

var nrm = { x: 0 , y: 0 , z: 0 } ;


var halfScaleMat = nmg.genScaleMatrix(0.5,0.5,0.5);

var degy = 0 , yinc = 1 , ymin = -89, ymax = 89 ;
var rotYmat ; 

function drawframe(){

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// VERTS
	verts = new Float32Array( vlen );
	setVerts(verts);

	matUtil.multiply1x4times4x4( verts , halfScaleMat );

	rotYmat = nmg.genRotateAboutYmatrix( degy );

	matUtil.multiply1x4times4x4( verts , rotYmat );

	ngl.loadAttribute ( "vert" , verts , dimVec );


	// COLOURS
	calcNormal(verts , nrm );
	lightFactor = dotProduct ( nrm , dlight );
	if ( lightFactor < minLight ) lightFactor = minLight;
	//console.log( nrm.x , nrm.y , nrm.z )
	console.log( lightFactor );

	colours = new Float32Array( clen );
	setColours(colours);

	lightFactoring ( colours , lightFactor );

	ngl.loadAttribute ( "colour" , colours , dimClr );


	// DRAW
	gl.drawArrays(gl.TRIANGLES, startIdx, cnt);

	degy += yinc;

	if (degy > ymax || degy < ymin ) { yinc *= -1; }
	
	setTimeout( drawframe, 100 );


}
drawframe();

