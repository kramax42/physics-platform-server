export const documentaion = `<pre>
getData1D: (
  [omega, tau],
  reload,
  material vector,
  size ,
  epsilin array,
  mu array,
  sigma array,
  relative source position array )

getData2D: (
   [lambda, beamsize],
   reload,
   material matrix (flat),
   size (size x size),
   epsilin array,
   mu array,
   sigma array,
   data return type(number)   ('Ez' = 0 | 'Hy' = 1 |'Hx' = 2 |'Energy' = 3),
   relative source position array )

synchronize step: ( step: number )
</pre>`;