// Executes a bounded number of asynchronous jobs, preserving the input order.
// A failing job rejects the batch; callers decide whether errors are recoverable.
export async function mapWithConcurrency<T,R>(
  input:readonly T[],limit:number,mapper:(value:T,index:number)=>Promise<R>,
):Promise<R[]> {
  if(!Number.isInteger(limit)||limit<1)throw new RangeError("limit must be positive");
  const output=new Array<R>(input.length);
  let next=0;
  async function worker(){
    while(next<input.length){
      const index=next++;
      output[index]=await mapper(input[index],index);
    }
  }
  await Promise.all(Array.from({length:Math.min(limit,input.length)},()=>worker()));
  return output;
}
