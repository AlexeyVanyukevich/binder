export type EventHandler = (data: any) => Promise<any>;

export interface EventEmitter {
  on(type: string, handler: EventHandler): void;
  off(type: string, handler: EventHandler): void;
  once(type: string, handler: EventHandler): void;
  emit(type: string, data: any): void;
}

export declare function eventEmitter(): EventEmitter;
