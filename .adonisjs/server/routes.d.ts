import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'create_room': { paramsTuple?: []; params?: {} }
    'show_room': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'join_room': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'leave_room': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'update_settings': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'start_game': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'submit_answer': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'show_room': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'show_room': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'event_stream': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'create_room': { paramsTuple?: []; params?: {} }
    'join_room': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'leave_room': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'update_settings': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'start_game': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'submit_answer': { paramsTuple: [ParamValue]; params: {'code': ParamValue} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}