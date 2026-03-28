const data={alpha:1,beta:[1,2,3],gamma:{delta:'value',epsilon:true}}

export function formatThings(input:{items:Array<string>,flag:boolean}){return input.flag?data.gamma.delta:input.items.map((item)=>({item,length:item.length,}))}
