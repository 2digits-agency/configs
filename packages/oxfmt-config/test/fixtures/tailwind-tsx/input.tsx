import { cn } from '@/lib/cn';

type Props={isActive:boolean;className?:string;title:string}

export function Card({isActive,className,title}:Props){return <div className={cn('rounded bg-blue-500 px-4 text-white font-bold',isActive&&'hover:bg-blue-600',className)} data-title={title}><span className="bg-white px-2 py-1 text-sm font-semibold text-black rounded">{title}</span></div>}
