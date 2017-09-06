/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue, Token
} from '@phosphor/coreutils';

import {
  ISignal
} from '@phosphor/signaling';


/**
 * An object which stores application state in a db-like fashion.
 */
export
interface IModelDB extends IIterable<IDBTable<{}>> {
  /**
   * Whether the model can currently undo a transaction.
   */
  readonly canUndo: boolean;

  /**
   * Whether the model can currently redo an undone transaction.
   */
  readonly canRedo: boolean;

  /**
   * Undo the most recent transaction to the model.
   *
   * #### Notes
   * This is a no-op if `canUndo` is false.
   */
  undo(): void;

  /**
   * Redo the most recent undo operation on the model.
   *
   * #### Notes
   * This is a no-op if `canRedo` is false.
   */
  redo(): void;

  /**
   * Execute a transaction on the db.
   *
   * @param fn - The function to invoke to execute the transaction.
   *
   * @throws An exception if this method is called recursively.
   *
   * #### Notes
   * The db state can only be modified from within a transaction.
   *
   * Each transaction forms an undo checkpoint.
   */
  transact(fn: () => void): void;

  /**
   * Create a new DB list.
   *
   * @param values - The initial values for the list.
   *
   * @returns A new db list with the initial values.
   */
  createList<T extends ReadonlyJSONValue>(values?: IterableOrArrayLike<T>): IDBList<T>;

  /**
   * Create a new DB map.
   *
   * @param items - The initial items for the map.
   *
   * @returns A new db map with the initial items.
   */
  createMap<T extends ReadonlyJSONValue>(items?: { [key: string]: T }): IDBMap<T>;

  /**
   * Create a new DB string.
   *
   * @param value - The initial value for the string.
   *
   * @returns A new db string with the initial value.
   */
  createString(value?: string): IDBString;

  /**
   * Create a new DB record.
   *
   * @param state - The initial state for the record.
   *
   * @returns A new db record with the initial state.
   */
  createRecord<T extends IDBRecord.State>(state: T): IDBRecord.Instance<T>;

  /**
   * Create a new db table.
   *
   * @param token - The token for the table.
   *
   * @param records - The initial records for the table.
   *
   * @returns The new db table populated with the initial records.
   *
   * @throws An exception if the table has already been created.
   */
  createTable<T extends IDBRecord.State>(token: Token<T>, records?: IterableOrArrayLike<IDBRecord.Instance<T>>): IDBTable<T>;

  /**
   * Test whether a specific table has been created.
   *
   * @param token - The token for the table of interest.
   *
   * @returns `true` if the table has been created, `false` otherwise.
   */
  hasTable<T extends IDBRecord.State>(token: Token<T>): boolean;

  /**
   * Get the table for a specific token.
   *
   * @param token - The token for the table of interest.
   *
   * @returns The table for the specified token.
   *
   * @throws An exception the table has not yet been created.
   */
  getTable<T extends IDBRecord.State>(token: Token<T>): IDBTable<T>;

  /**
   * Delete a table from the model db.
   *
   * @param token - The token for the table to delete.
   *
   * @throws An exception the table has not yet been created.
   */
  deleteTable<T extends IDBRecord.State>(token: Token<T>): void;
}


/**
 * The common base state for objects created by a model db.
 */
export
interface IDBObject {
  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'list' | 'map' | 'string' | 'record' | 'table';

  /**
   * The unique db id of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbId: string;

  /**
   * The db parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbParent: IDBObject | null;

  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<IDBObject, IDBObject.IChangedArgs>;
}


/**
 * The namespace for the `IDBObject` interface statics.
 */
export
namespace IDBObject {
  /**
   * The base data for a change to a db object.
   */
  export
  interface IChange {
    /**
     * Whether the change was generated by an undo action.
     */
    readonly isUndo: boolean;

    /**
     * Whether the change was generated by a redo action.
     */
    readonly isRedo: boolean;

    /**
     * Whether the change was generated by the local application.
     */
    readonly isLocal: boolean;

    /**
     * The id of the user which generated the change.
     */
    readonly userId: string;

    /**
     * The id of the session which generated the change.
     */
    readonly sessionId: string;
  }

  /**
   * The type of the db object changed arguments.
   */
  export
  interface IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'list' | 'map' | 'string' | 'record' | 'table';

    /**
     * The db object which generated the changes.
     */
    readonly target: IDBObject;

    /**
     * The changes applied to the object.
     */
    readonly changes: ReadonlyArray<IChange>;
  }
}


/**
 * A db object which holds an ordered collection of JSON values.
 */
export
interface IDBList<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDBObject, IIterable<T>, IRetroable<T> {
  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'list';

  /**
   * The db parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbParent: IDBRecord<{}> | null;

  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<IDBList<T>, IDBList.IChangedArgs<T>>;

  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The length of the list.
   *
   * #### Complexity
   * Constant.
   */
  readonly length: number;

  /**
   * The first value in the list or `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly first: T | undefined;

  /**
   * The last value in the list or `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly last: T | undefined;

  /**
   * Find the index of the first occurrence of a value in the list.
   *
   * @param value - The value to locate in the list. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the first occurrence of the value, or `-1`
   *   if the value is not found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  indexOf(value: T, start?: number, stop?: number): number;

  /**
   * Find the index of the last occurrence of a value in the list.
   *
   * @param value - The value to locate in the list. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the last occurrence of the value, or `-1`
   *   if the value is not found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  lastIndexOf(value: T, start?: number, stop?: number): number;

  /**
   * Find the index of the first value which matches a predicate.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the first matching value, or `-1` if no
   *   matching value is found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the list while searching.
   */
  findIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number;

  /**
   * Find the index of the last value which matches a predicate.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the last matching value, or `-1` if no
   *   matching value is found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the list while searching.
   */
  findLastIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number;

  /**
   * Get the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the list.
   *
   * @returns The value at the specified index or `undefined` if the
   *   index is out of range.
   *
   * #### Complexity
   * Constant.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  get(index: number): T | undefined;

  /**
   * Set the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the list.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Notes
   * This method is a no-op if `index` is out of range.
   *
   * #### Complexity
   * Constant.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  set(index: number, value: T): void;

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the list.
   *
   * #### Complexity
   * Constant.
   */
  push(value: T): void;

  /**
   * Insert a value into the list.
   *
   * @param index - The index at which to insert the value. Negative
   *   values are taken as an offset from the end of the list.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  insert(index: number, value: T): void;

  /**
   * Remove a value at a specific index in the list.
   *
   * @param index - The index of the value to remove. Negative values
   *   are taken as an offset from the end of the array.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  remove(index: number): void;

  /**
   * Replace a range of values in the list.
   *
   * @param index - The index of the first element to be removed.
   *   Negative values are taken as an offset from the end of the list.
   *
   * @param count - The number of elements to remove.
   *
   * @param values - The values to insert at the specified index.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, values?: IterableOrArrayLike<T>): void;

  /**
   * Clear all values from the list.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}


/**
 * The namespace for the `IDBList` interface statics.
 */
export
namespace IDBList {
  /**
   * The data for a db list change.
   */
  export
  interface IChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDBObject.IChange {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The values that were removed from the given index.
     */
    readonly removed: ReadonlyArray<T>;

    /**
     * The values that were added at the given index.
     */
    readonly added: ReadonlyArray<T>;
  }

  /**
   * The type of the db list changed arguments.
   */
  export
  interface IChangedArgs<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDBObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'list';

    /**
     * The db list which generated the changes.
     */
    readonly target: IDBList<T>;

    /**
     * The changes applied to the list.
     */
    readonly changes: ReadonlyArray<IChange<T>>;
  }
}


/**
 * A db object which maps string keys to JSON values.
 */
export
interface IDBMap<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDBObject, IIterable<[string, T]> {
  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'map';

  /**
   * The db parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbParent: IDBRecord<{}> | null;

  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<IDBMap<T>, IDBMap.IChangedArgs<T>>;

  /**
   * Whether the map is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The size of the map.
   *
   * #### Complexity
   * Constant.
   */
  readonly size: number;

  /**
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator over the keys in the map.
   *
   * #### Notes
   * The order of iteration is undefined.
   *
   * #### Complexity
   * Constant.
   */
  keys(): IIterator<string>;

  /**
   * Create an iterator over the values in the map.
   *
   * @returns A new iterator over the values in the map.
   *
   * #### Notes
   * The order of iteration is undefined.
   *
   * #### Complexity
   * Constant.
   */
  values(): IIterator<T>;

  /**
   * Test whether the map has a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns `true` if the map has the given key, `false` otherwise.
   *
   * #### Complexity
   * Constant.
   */
  has(key: string): boolean;

  /**
   * Get the value for a particular key in the map.
   *
   * @param key - The key of interest.
   *
   * @returns The key value or `undefined` if the key is missing.
   *
   * #### Complexity
   * Constant.
   */
  get(key: string): T | undefined;

  /**
   * Set the value for a particular key in the map.
   *
   * @param key - The key of interest.
   *
   * @param value - The value to set for the given key.
   *
   * #### Complexity
   * Constant.
   */
  set(key: string, value: T): void;

  /**
   * Delete an item from the map.
   *
   * @param key - The key of the item to delete from the map.
   *
   * #### Complexity
   * Constant.
   */
  delete(key: string): void;

  /**
   * Clear all items from the map.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}


/**
 * The namespace for the `IDBMap` interface statics.
 */
export
namespace IDBMap {
  /**
   * The data for a db map change.
   */
  export
  interface IChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDBObject.IChange {
    /**
     * The items that were removed from the map.
     */
    readonly removed: { readonly [key: string]: T };

    /**
     * The items that were added to the map.
     */
    readonly added: { readonly [key: string]: T };
  }

  /**
   * The type of the db map changed arguments.
   */
  export
  interface IChangedArgs<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDBObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'map';

    /**
     * The map which generated the changes.
     */
    readonly target: IDBMap<T>;

    /**
     * The changes applied to the map.
     */
    readonly changes: ReadonlyArray<IChange<T>>;
  }
}


/**
 * A db object which holds a string.
 */
export
interface IDBString extends IDBObject {
  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'string';

  /**
   * The db parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbParent: IDBRecord<{}> | null;

  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<IDBString, IDBString.IChangedArgs>;

  /**
   * Whether the string is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The length of the string.
   *
   * #### Complexity
   * Constant.
   */
  readonly length: number;

  /**
   * Get the value of the db string.
   *
   * @returns The current string value.
   */
  get(): string;

  /**
   * Set the value of the db string.
   *
   * @param value - The desired value for the string.
   */
  set(value: string): void;

  /**
   * Add text to the end of the string.
   *
   * @param value - The text to add to the end of the string.
   */
  append(value: string): void;

  /**
   * Insert text into the string.
   *
   * @param index - The index at which to insert the text.
   *
   * @param value - The text to insert into the string.
   */
  insert(index: number, value: string): void;

  /**
   * Replace a range of text in the string.
   *
   * @param index - The index of the first character to be removed.
   *   Negative values are offset from the end of the string.
   *
   * @param count - The number of characters to remove.
   *
   * @param value - The text to insert at the specified index.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, value?: string): void;

  /**
   * Clear the string.
   */
  clear(): void;
}


/**
 * The namespace for the `IDBString` interface statics.
 */
export
namespace IDBString {
  /**
   * The data for a db map change.
   */
  export
  interface IChange extends IDBObject.IChange {
    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The text that was removed from the string.
     */
    readonly removed: string;

    /**
     * The text that was added to the string.
     */
    readonly added: string;
  }

  /**
   * The type of the db string changed arguments.
   */
  export
  interface IChangedArgs extends IDBObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'string';

    /**
     * The string which generated the changes.
     */
    readonly target: IDBString;

    /**
     * The changes applied to the string.
     */
    readonly changes: ReadonlyArray<IChange>;
  }
}


/**
 * A db object which holds well-defined state.
 */
export
interface IDBRecord<T extends IDBRecord.State> extends IDBObject {
  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'record';

  /**
   * The db parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbParent: IDBTable<T> | null;

  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<IDBRecord.Instance<T>, IDBRecord.IChangedArgs<T> | IDBRecord.BubbledArgs>;

  /**
   * Get the value for a property in the record.
   *
   * @param name - The name of the property of interest.
   *
   * @returns The value for the property.
   *
   * #### Complexity
   * Constant.
   */
  get<K extends keyof T>(name: K): T[K];

  /**
   * Set the value for a property in the record.
   *
   * @param name - The name of the property of interest.
   *
   * @param value - The value for the property.
   *
   * #### Complexity
   * Constant.
   */
  set<K extends keyof T>(name: K, value: T[K]): void;
}


/**
 * The namespace for the `IDBRecord` interface statics.
 */
export
namespace IDBRecord {
  /**
   * The allowed state of a db record.
   */
  export
  type State = {
    /**
     * The index signature for the state of a db record.
     */
    [key: string]: ReadonlyJSONValue | IDBList | IDBMap | IDBString;
  };

  /**
   * A type alias for a db record instance.
   */
  export
  type Instance<T extends State> = T & IDBRecord<T>;

  /**
   * The data for a db record change.
   */
  export
  interface IChange<T extends State> extends IDBObject.IChange {
    /**
     * The old state of the record.
     */
    readonly oldState: Readonly<Partial<T>>;

    /**
     * The new state of the record.
     */
    readonly newState: Readonly<Partial<T>>;
  }

  /**
   * The type of the db record changed arguments.
   */
  export
  interface IChangedArgs<T extends State> extends IDBObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'record';

    /**
     * The record which generated the changes.
     */
    readonly target: Instance<T>;

    /**
     * The changes applied to the record.
     */
    readonly changes: ReadonlyArray<IChange<T>>;
  }

  /**
   * A type alias for the db record bubbled args.
   */
  export
  type BubbledArgs = IDBList.IChangedArgs | IDBMap.IChangedArgs | IDBString.IChangedArgs;
}


/**
 * A db object which holds records.
 */
export
interface IDBTable<T extends IDBRecord.State> extends IDBObject, IIterable<IDBRecord.Instance<T>> {
  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'table';

  /**
   * The db parent of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbParent: null;

  /**
   * The token associated with the table.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbToken: Token<T>;

  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<IDBTable<T>, IDBTable.IChangedArgs<T> | IDBTable.BubbledArgs<T>>;

  /**
   * Whether the table is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The size of the table.
   *
   * #### Complexity
   * Constant.
   */
  readonly size: number;

  /**
   * Test whether the table has a particular record.
   *
   * @param id - The record id of interest.
   *
   * @returns `true` if the table has the record, `false` otherwise.
   *
   * #### Complexity
   * Constant.
   */
  has(id: string): boolean;

  /**
   * Get the record for a particular id the table.
   *
   * @param id - The record id of interest.
   *
   * @returns The request record, or `undefined` if the id is missing.
   *
   * #### Complexity
   * Constant.
   */
  get(id: string): IDBRecord.Instance<T> | undefined;

  /**
   * Insert a record into the table
   *
   * @param record - The record to insert into the table.
   *
   * #### Complexity
   * Constant.
   */
  insert(record: IDBRecord.Instance<T>): void;

  /**
   * Delete a record or records from the table.
   *
   * @param id - The id of the record to delete from the table.
   *
   * #### Complexity
   * Constant.
   */
  delete(id: string): void;

  /**
   * Clear all records from the table.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}


/**
 * The namespace for the `IDBTable` interface statics.
 */
export
namespace IDBTable {
  /**
   * The data for a db table change.
   */
  export
  interface IChange<T extends IDBRecord.State> extends IDBObject.IChange {
    /**
     * The records that were removed from the table.
     */
    readonly removed: ReadonlyArray<IDBRecord.Instance<T>>;

    /**
     * The records that were added to the table.
     */
    readonly added: ReadonlyArray<IDBRecord.Instance<T>>;
  }

  /**
   * The type of the db table changed arguments.
   */
  export
  interface IChangedArgs<T extends IDBRecord.State> extends IDBObject.IChangedArgs {
    /**
     * The type of the change.
     */
    readonly type: 'table';

    /**
     * The table which generated the changes.
     */
    readonly target: IDBTable<T>;

    /**
     * The changes applied to the table.
     */
    readonly changes: ReadonlyArray<IChange<T>>;
  }

  /**
   * A type alias for the db table bubbled args.
   */
  export
  type BubbledArgs<T extends IDBRecord.State> = IDBRecord.IChangedArgs<T> | IDBRecord.BubbledArgs;
}
