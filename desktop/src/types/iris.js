/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const iris = $root.iris = (() => {

    /**
     * Namespace iris.
     * @exports iris
     * @namespace
     */
    const iris = {};

    iris.v1 = (function() {

        /**
         * Namespace v1.
         * @memberof iris
         * @namespace
         */
        const v1 = {};

        /**
         * FrameType enum.
         * @name iris.v1.FrameType
         * @enum {number}
         * @property {number} FRAME_TYPE_UNSPECIFIED=0 FRAME_TYPE_UNSPECIFIED value
         * @property {number} REQUEST=1 REQUEST value
         * @property {number} RESPONSE=2 RESPONSE value
         * @property {number} NOTICE=3 NOTICE value
         */
        v1.FrameType = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "FRAME_TYPE_UNSPECIFIED"] = 0;
            values[valuesById[1] = "REQUEST"] = 1;
            values[valuesById[2] = "RESPONSE"] = 2;
            values[valuesById[3] = "NOTICE"] = 3;
            return values;
        })();

        /**
         * MsgType enum.
         * @name iris.v1.MsgType
         * @enum {number}
         * @property {number} MSG_TYPE_UNSPECIFIED=0 MSG_TYPE_UNSPECIFIED value
         * @property {number} TEXT=1 TEXT value
         * @property {number} IMAGE=2 IMAGE value
         * @property {number} FILE=3 FILE value
         * @property {number} SYSTEM=4 SYSTEM value
         */
        v1.MsgType = (function() {
            const valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "MSG_TYPE_UNSPECIFIED"] = 0;
            values[valuesById[1] = "TEXT"] = 1;
            values[valuesById[2] = "IMAGE"] = 2;
            values[valuesById[3] = "FILE"] = 3;
            values[valuesById[4] = "SYSTEM"] = 4;
            return values;
        })();

        v1.Frame = (function() {

            /**
             * Properties of a Frame.
             * @memberof iris.v1
             * @interface IFrame
             * @property {number|Long|null} [id] Frame id
             * @property {iris.v1.FrameType|null} [frameType] Frame frameType
             * @property {string|null} [method] Frame method
             * @property {Uint8Array|null} [payload] Frame payload
             * @property {number|null} [code] Frame code
             * @property {string|null} [msg] Frame msg
             */

            /**
             * Constructs a new Frame.
             * @memberof iris.v1
             * @classdesc Represents a Frame.
             * @implements IFrame
             * @constructor
             * @param {iris.v1.IFrame=} [properties] Properties to set
             */
            function Frame(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Frame id.
             * @member {number|Long} id
             * @memberof iris.v1.Frame
             * @instance
             */
            Frame.prototype.id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Frame frameType.
             * @member {iris.v1.FrameType} frameType
             * @memberof iris.v1.Frame
             * @instance
             */
            Frame.prototype.frameType = 0;

            /**
             * Frame method.
             * @member {string} method
             * @memberof iris.v1.Frame
             * @instance
             */
            Frame.prototype.method = "";

            /**
             * Frame payload.
             * @member {Uint8Array} payload
             * @memberof iris.v1.Frame
             * @instance
             */
            Frame.prototype.payload = $util.newBuffer([]);

            /**
             * Frame code.
             * @member {number} code
             * @memberof iris.v1.Frame
             * @instance
             */
            Frame.prototype.code = 0;

            /**
             * Frame msg.
             * @member {string} msg
             * @memberof iris.v1.Frame
             * @instance
             */
            Frame.prototype.msg = "";

            /**
             * Creates a new Frame instance using the specified properties.
             * @function create
             * @memberof iris.v1.Frame
             * @static
             * @param {iris.v1.IFrame=} [properties] Properties to set
             * @returns {iris.v1.Frame} Frame instance
             */
            Frame.create = function create(properties) {
                return new Frame(properties);
            };

            /**
             * Encodes the specified Frame message. Does not implicitly {@link iris.v1.Frame.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.Frame
             * @static
             * @param {iris.v1.IFrame} message Frame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Frame.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.id);
                if (message.frameType != null && Object.hasOwnProperty.call(message, "frameType"))
                    writer.uint32(/* id 2, wireType 0 =*/16).int32(message.frameType);
                if (message.method != null && Object.hasOwnProperty.call(message, "method"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.method);
                if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
                    writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.payload);
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.code);
                if (message.msg != null && Object.hasOwnProperty.call(message, "msg"))
                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.msg);
                return writer;
            };

            /**
             * Encodes the specified Frame message, length delimited. Does not implicitly {@link iris.v1.Frame.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.Frame
             * @static
             * @param {iris.v1.IFrame} message Frame message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Frame.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a Frame message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.Frame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.Frame} Frame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Frame.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.Frame();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.id = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.frameType = reader.int32();
                            break;
                        }
                    case 3: {
                            message.method = reader.string();
                            break;
                        }
                    case 4: {
                            message.payload = reader.bytes();
                            break;
                        }
                    case 5: {
                            message.code = reader.uint32();
                            break;
                        }
                    case 6: {
                            message.msg = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a Frame message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.Frame
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.Frame} Frame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Frame.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Frame message.
             * @function verify
             * @memberof iris.v1.Frame
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Frame.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                        return "id: integer|Long expected";
                if (message.frameType != null && Object.hasOwnProperty.call(message, "frameType"))
                    switch (message.frameType) {
                    default:
                        return "frameType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        break;
                    }
                if (message.method != null && Object.hasOwnProperty.call(message, "method"))
                    if (!$util.isString(message.method))
                        return "method: string expected";
                if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
                    if (!(message.payload && typeof message.payload.length === "number" || $util.isString(message.payload)))
                        return "payload: buffer expected";
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    if (!$util.isInteger(message.code))
                        return "code: integer expected";
                if (message.msg != null && Object.hasOwnProperty.call(message, "msg"))
                    if (!$util.isString(message.msg))
                        return "msg: string expected";
                return null;
            };

            /**
             * Creates a Frame message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.Frame
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.Frame} Frame
             */
            Frame.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.Frame)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.Frame: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.Frame();
                if (object.id != null)
                    if ($util.Long)
                        message.id = $util.Long.fromValue(object.id, true);
                    else if (typeof object.id === "string")
                        message.id = parseInt(object.id, 10);
                    else if (typeof object.id === "number")
                        message.id = object.id;
                    else if (typeof object.id === "object")
                        message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(true);
                switch (object.frameType) {
                default:
                    if (typeof object.frameType === "number") {
                        message.frameType = object.frameType;
                        break;
                    }
                    break;
                case "FRAME_TYPE_UNSPECIFIED":
                case 0:
                    message.frameType = 0;
                    break;
                case "REQUEST":
                case 1:
                    message.frameType = 1;
                    break;
                case "RESPONSE":
                case 2:
                    message.frameType = 2;
                    break;
                case "NOTICE":
                case 3:
                    message.frameType = 3;
                    break;
                }
                if (object.method != null)
                    message.method = String(object.method);
                if (object.payload != null)
                    if (typeof object.payload === "string")
                        $util.base64.decode(object.payload, message.payload = $util.newBuffer($util.base64.length(object.payload)), 0);
                    else if (object.payload.length >= 0)
                        message.payload = object.payload;
                if (object.code != null)
                    message.code = object.code >>> 0;
                if (object.msg != null)
                    message.msg = String(object.msg);
                return message;
            };

            /**
             * Creates a plain object from a Frame message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.Frame
             * @static
             * @param {iris.v1.Frame} message Frame
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Frame.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.frameType = options.enums === String ? "FRAME_TYPE_UNSPECIFIED" : 0;
                    object.method = "";
                    if (options.bytes === String)
                        object.payload = "";
                    else {
                        object.payload = [];
                        if (options.bytes !== Array)
                            object.payload = $util.newBuffer(object.payload);
                    }
                    object.code = 0;
                    object.msg = "";
                }
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.id = typeof message.id === "number" ? BigInt(message.id) : $util.Long.fromBits(message.id.low >>> 0, message.id.high >>> 0, true).toBigInt();
                    else if (typeof message.id === "number")
                        object.id = options.longs === String ? String(message.id) : message.id;
                    else
                        object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true) : message.id;
                if (message.frameType != null && Object.hasOwnProperty.call(message, "frameType"))
                    object.frameType = options.enums === String ? $root.iris.v1.FrameType[message.frameType] === undefined ? message.frameType : $root.iris.v1.FrameType[message.frameType] : message.frameType;
                if (message.method != null && Object.hasOwnProperty.call(message, "method"))
                    object.method = message.method;
                if (message.payload != null && Object.hasOwnProperty.call(message, "payload"))
                    object.payload = options.bytes === String ? $util.base64.encode(message.payload, 0, message.payload.length) : options.bytes === Array ? Array.prototype.slice.call(message.payload) : message.payload;
                if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                    object.code = message.code;
                if (message.msg != null && Object.hasOwnProperty.call(message, "msg"))
                    object.msg = message.msg;
                return object;
            };

            /**
             * Converts this Frame to JSON.
             * @function toJSON
             * @memberof iris.v1.Frame
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Frame.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Frame
             * @function getTypeUrl
             * @memberof iris.v1.Frame
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Frame.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.Frame";
            };

            return Frame;
        })();

        v1.MessageSendReq = (function() {

            /**
             * Properties of a MessageSendReq.
             * @memberof iris.v1
             * @interface IMessageSendReq
             * @property {string|null} [clientMsgId] MessageSendReq clientMsgId
             * @property {number|Long|null} [convId] MessageSendReq convId
             * @property {iris.v1.MsgType|null} [msgType] MessageSendReq msgType
             * @property {string|null} [content] MessageSendReq content
             * @property {number|Long|null} [toUid] MessageSendReq toUid
             */

            /**
             * Constructs a new MessageSendReq.
             * @memberof iris.v1
             * @classdesc Represents a MessageSendReq.
             * @implements IMessageSendReq
             * @constructor
             * @param {iris.v1.IMessageSendReq=} [properties] Properties to set
             */
            function MessageSendReq(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MessageSendReq clientMsgId.
             * @member {string} clientMsgId
             * @memberof iris.v1.MessageSendReq
             * @instance
             */
            MessageSendReq.prototype.clientMsgId = "";

            /**
             * MessageSendReq convId.
             * @member {number|Long} convId
             * @memberof iris.v1.MessageSendReq
             * @instance
             */
            MessageSendReq.prototype.convId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * MessageSendReq msgType.
             * @member {iris.v1.MsgType} msgType
             * @memberof iris.v1.MessageSendReq
             * @instance
             */
            MessageSendReq.prototype.msgType = 0;

            /**
             * MessageSendReq content.
             * @member {string} content
             * @memberof iris.v1.MessageSendReq
             * @instance
             */
            MessageSendReq.prototype.content = "";

            /**
             * MessageSendReq toUid.
             * @member {number|Long} toUid
             * @memberof iris.v1.MessageSendReq
             * @instance
             */
            MessageSendReq.prototype.toUid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new MessageSendReq instance using the specified properties.
             * @function create
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {iris.v1.IMessageSendReq=} [properties] Properties to set
             * @returns {iris.v1.MessageSendReq} MessageSendReq instance
             */
            MessageSendReq.create = function create(properties) {
                return new MessageSendReq(properties);
            };

            /**
             * Encodes the specified MessageSendReq message. Does not implicitly {@link iris.v1.MessageSendReq.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {iris.v1.IMessageSendReq} message MessageSendReq message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageSendReq.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.clientMsgId);
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.convId);
                if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.msgType);
                if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.content);
                if (message.toUid != null && Object.hasOwnProperty.call(message, "toUid"))
                    writer.uint32(/* id 5, wireType 0 =*/40).uint64(message.toUid);
                return writer;
            };

            /**
             * Encodes the specified MessageSendReq message, length delimited. Does not implicitly {@link iris.v1.MessageSendReq.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {iris.v1.IMessageSendReq} message MessageSendReq message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageSendReq.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a MessageSendReq message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.MessageSendReq} MessageSendReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageSendReq.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.MessageSendReq();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.clientMsgId = reader.string();
                            break;
                        }
                    case 2: {
                            message.convId = reader.uint64();
                            break;
                        }
                    case 3: {
                            message.msgType = reader.int32();
                            break;
                        }
                    case 4: {
                            message.content = reader.string();
                            break;
                        }
                    case 5: {
                            message.toUid = reader.uint64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a MessageSendReq message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.MessageSendReq} MessageSendReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageSendReq.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MessageSendReq message.
             * @function verify
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MessageSendReq.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    if (!$util.isString(message.clientMsgId))
                        return "clientMsgId: string expected";
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (!$util.isInteger(message.convId) && !(message.convId && $util.isInteger(message.convId.low) && $util.isInteger(message.convId.high)))
                        return "convId: integer|Long expected";
                if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
                    switch (message.msgType) {
                    default:
                        return "msgType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                    if (!$util.isString(message.content))
                        return "content: string expected";
                if (message.toUid != null && Object.hasOwnProperty.call(message, "toUid"))
                    if (!$util.isInteger(message.toUid) && !(message.toUid && $util.isInteger(message.toUid.low) && $util.isInteger(message.toUid.high)))
                        return "toUid: integer|Long expected";
                return null;
            };

            /**
             * Creates a MessageSendReq message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.MessageSendReq} MessageSendReq
             */
            MessageSendReq.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.MessageSendReq)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.MessageSendReq: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.MessageSendReq();
                if (object.clientMsgId != null)
                    message.clientMsgId = String(object.clientMsgId);
                if (object.convId != null)
                    if ($util.Long)
                        message.convId = $util.Long.fromValue(object.convId, true);
                    else if (typeof object.convId === "string")
                        message.convId = parseInt(object.convId, 10);
                    else if (typeof object.convId === "number")
                        message.convId = object.convId;
                    else if (typeof object.convId === "object")
                        message.convId = new $util.LongBits(object.convId.low >>> 0, object.convId.high >>> 0).toNumber(true);
                switch (object.msgType) {
                default:
                    if (typeof object.msgType === "number") {
                        message.msgType = object.msgType;
                        break;
                    }
                    break;
                case "MSG_TYPE_UNSPECIFIED":
                case 0:
                    message.msgType = 0;
                    break;
                case "TEXT":
                case 1:
                    message.msgType = 1;
                    break;
                case "IMAGE":
                case 2:
                    message.msgType = 2;
                    break;
                case "FILE":
                case 3:
                    message.msgType = 3;
                    break;
                case "SYSTEM":
                case 4:
                    message.msgType = 4;
                    break;
                }
                if (object.content != null)
                    message.content = String(object.content);
                if (object.toUid != null)
                    if ($util.Long)
                        message.toUid = $util.Long.fromValue(object.toUid, true);
                    else if (typeof object.toUid === "string")
                        message.toUid = parseInt(object.toUid, 10);
                    else if (typeof object.toUid === "number")
                        message.toUid = object.toUid;
                    else if (typeof object.toUid === "object")
                        message.toUid = new $util.LongBits(object.toUid.low >>> 0, object.toUid.high >>> 0).toNumber(true);
                return message;
            };

            /**
             * Creates a plain object from a MessageSendReq message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {iris.v1.MessageSendReq} message MessageSendReq
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MessageSendReq.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    object.clientMsgId = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.convId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.convId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.msgType = options.enums === String ? "MSG_TYPE_UNSPECIFIED" : 0;
                    object.content = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.toUid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.toUid = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                }
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    object.clientMsgId = message.clientMsgId;
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.convId = typeof message.convId === "number" ? BigInt(message.convId) : $util.Long.fromBits(message.convId.low >>> 0, message.convId.high >>> 0, true).toBigInt();
                    else if (typeof message.convId === "number")
                        object.convId = options.longs === String ? String(message.convId) : message.convId;
                    else
                        object.convId = options.longs === String ? $util.Long.prototype.toString.call(message.convId) : options.longs === Number ? new $util.LongBits(message.convId.low >>> 0, message.convId.high >>> 0).toNumber(true) : message.convId;
                if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
                    object.msgType = options.enums === String ? $root.iris.v1.MsgType[message.msgType] === undefined ? message.msgType : $root.iris.v1.MsgType[message.msgType] : message.msgType;
                if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                    object.content = message.content;
                if (message.toUid != null && Object.hasOwnProperty.call(message, "toUid"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.toUid = typeof message.toUid === "number" ? BigInt(message.toUid) : $util.Long.fromBits(message.toUid.low >>> 0, message.toUid.high >>> 0, true).toBigInt();
                    else if (typeof message.toUid === "number")
                        object.toUid = options.longs === String ? String(message.toUid) : message.toUid;
                    else
                        object.toUid = options.longs === String ? $util.Long.prototype.toString.call(message.toUid) : options.longs === Number ? new $util.LongBits(message.toUid.low >>> 0, message.toUid.high >>> 0).toNumber(true) : message.toUid;
                return object;
            };

            /**
             * Converts this MessageSendReq to JSON.
             * @function toJSON
             * @memberof iris.v1.MessageSendReq
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MessageSendReq.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for MessageSendReq
             * @function getTypeUrl
             * @memberof iris.v1.MessageSendReq
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            MessageSendReq.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.MessageSendReq";
            };

            return MessageSendReq;
        })();

        v1.MessageAckNotice = (function() {

            /**
             * Properties of a MessageAckNotice.
             * @memberof iris.v1
             * @interface IMessageAckNotice
             * @property {string|null} [clientMsgId] MessageAckNotice clientMsgId
             * @property {number|Long|null} [serverMsgId] MessageAckNotice serverMsgId
             * @property {number|Long|null} [convId] MessageAckNotice convId
             * @property {number|Long|null} [seq] MessageAckNotice seq
             * @property {number|Long|null} [createTimeMs] MessageAckNotice createTimeMs
             */

            /**
             * Constructs a new MessageAckNotice.
             * @memberof iris.v1
             * @classdesc Represents a MessageAckNotice.
             * @implements IMessageAckNotice
             * @constructor
             * @param {iris.v1.IMessageAckNotice=} [properties] Properties to set
             */
            function MessageAckNotice(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MessageAckNotice clientMsgId.
             * @member {string} clientMsgId
             * @memberof iris.v1.MessageAckNotice
             * @instance
             */
            MessageAckNotice.prototype.clientMsgId = "";

            /**
             * MessageAckNotice serverMsgId.
             * @member {number|Long} serverMsgId
             * @memberof iris.v1.MessageAckNotice
             * @instance
             */
            MessageAckNotice.prototype.serverMsgId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * MessageAckNotice convId.
             * @member {number|Long} convId
             * @memberof iris.v1.MessageAckNotice
             * @instance
             */
            MessageAckNotice.prototype.convId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * MessageAckNotice seq.
             * @member {number|Long} seq
             * @memberof iris.v1.MessageAckNotice
             * @instance
             */
            MessageAckNotice.prototype.seq = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * MessageAckNotice createTimeMs.
             * @member {number|Long} createTimeMs
             * @memberof iris.v1.MessageAckNotice
             * @instance
             */
            MessageAckNotice.prototype.createTimeMs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new MessageAckNotice instance using the specified properties.
             * @function create
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {iris.v1.IMessageAckNotice=} [properties] Properties to set
             * @returns {iris.v1.MessageAckNotice} MessageAckNotice instance
             */
            MessageAckNotice.create = function create(properties) {
                return new MessageAckNotice(properties);
            };

            /**
             * Encodes the specified MessageAckNotice message. Does not implicitly {@link iris.v1.MessageAckNotice.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {iris.v1.IMessageAckNotice} message MessageAckNotice message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageAckNotice.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.clientMsgId);
                if (message.serverMsgId != null && Object.hasOwnProperty.call(message, "serverMsgId"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.serverMsgId);
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.convId);
                if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                    writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.seq);
                if (message.createTimeMs != null && Object.hasOwnProperty.call(message, "createTimeMs"))
                    writer.uint32(/* id 5, wireType 0 =*/40).int64(message.createTimeMs);
                return writer;
            };

            /**
             * Encodes the specified MessageAckNotice message, length delimited. Does not implicitly {@link iris.v1.MessageAckNotice.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {iris.v1.IMessageAckNotice} message MessageAckNotice message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessageAckNotice.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a MessageAckNotice message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.MessageAckNotice} MessageAckNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageAckNotice.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.MessageAckNotice();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.clientMsgId = reader.string();
                            break;
                        }
                    case 2: {
                            message.serverMsgId = reader.uint64();
                            break;
                        }
                    case 3: {
                            message.convId = reader.uint64();
                            break;
                        }
                    case 4: {
                            message.seq = reader.uint64();
                            break;
                        }
                    case 5: {
                            message.createTimeMs = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a MessageAckNotice message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.MessageAckNotice} MessageAckNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessageAckNotice.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MessageAckNotice message.
             * @function verify
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MessageAckNotice.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    if (!$util.isString(message.clientMsgId))
                        return "clientMsgId: string expected";
                if (message.serverMsgId != null && Object.hasOwnProperty.call(message, "serverMsgId"))
                    if (!$util.isInteger(message.serverMsgId) && !(message.serverMsgId && $util.isInteger(message.serverMsgId.low) && $util.isInteger(message.serverMsgId.high)))
                        return "serverMsgId: integer|Long expected";
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (!$util.isInteger(message.convId) && !(message.convId && $util.isInteger(message.convId.low) && $util.isInteger(message.convId.high)))
                        return "convId: integer|Long expected";
                if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                    if (!$util.isInteger(message.seq) && !(message.seq && $util.isInteger(message.seq.low) && $util.isInteger(message.seq.high)))
                        return "seq: integer|Long expected";
                if (message.createTimeMs != null && Object.hasOwnProperty.call(message, "createTimeMs"))
                    if (!$util.isInteger(message.createTimeMs) && !(message.createTimeMs && $util.isInteger(message.createTimeMs.low) && $util.isInteger(message.createTimeMs.high)))
                        return "createTimeMs: integer|Long expected";
                return null;
            };

            /**
             * Creates a MessageAckNotice message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.MessageAckNotice} MessageAckNotice
             */
            MessageAckNotice.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.MessageAckNotice)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.MessageAckNotice: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.MessageAckNotice();
                if (object.clientMsgId != null)
                    message.clientMsgId = String(object.clientMsgId);
                if (object.serverMsgId != null)
                    if ($util.Long)
                        message.serverMsgId = $util.Long.fromValue(object.serverMsgId, true);
                    else if (typeof object.serverMsgId === "string")
                        message.serverMsgId = parseInt(object.serverMsgId, 10);
                    else if (typeof object.serverMsgId === "number")
                        message.serverMsgId = object.serverMsgId;
                    else if (typeof object.serverMsgId === "object")
                        message.serverMsgId = new $util.LongBits(object.serverMsgId.low >>> 0, object.serverMsgId.high >>> 0).toNumber(true);
                if (object.convId != null)
                    if ($util.Long)
                        message.convId = $util.Long.fromValue(object.convId, true);
                    else if (typeof object.convId === "string")
                        message.convId = parseInt(object.convId, 10);
                    else if (typeof object.convId === "number")
                        message.convId = object.convId;
                    else if (typeof object.convId === "object")
                        message.convId = new $util.LongBits(object.convId.low >>> 0, object.convId.high >>> 0).toNumber(true);
                if (object.seq != null)
                    if ($util.Long)
                        message.seq = $util.Long.fromValue(object.seq, true);
                    else if (typeof object.seq === "string")
                        message.seq = parseInt(object.seq, 10);
                    else if (typeof object.seq === "number")
                        message.seq = object.seq;
                    else if (typeof object.seq === "object")
                        message.seq = new $util.LongBits(object.seq.low >>> 0, object.seq.high >>> 0).toNumber(true);
                if (object.createTimeMs != null)
                    if ($util.Long)
                        message.createTimeMs = $util.Long.fromValue(object.createTimeMs, false);
                    else if (typeof object.createTimeMs === "string")
                        message.createTimeMs = parseInt(object.createTimeMs, 10);
                    else if (typeof object.createTimeMs === "number")
                        message.createTimeMs = object.createTimeMs;
                    else if (typeof object.createTimeMs === "object")
                        message.createTimeMs = new $util.LongBits(object.createTimeMs.low >>> 0, object.createTimeMs.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a MessageAckNotice message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {iris.v1.MessageAckNotice} message MessageAckNotice
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MessageAckNotice.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    object.clientMsgId = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.serverMsgId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.serverMsgId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.convId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.convId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.seq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.seq = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.createTimeMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.createTimeMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                }
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    object.clientMsgId = message.clientMsgId;
                if (message.serverMsgId != null && Object.hasOwnProperty.call(message, "serverMsgId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.serverMsgId = typeof message.serverMsgId === "number" ? BigInt(message.serverMsgId) : $util.Long.fromBits(message.serverMsgId.low >>> 0, message.serverMsgId.high >>> 0, true).toBigInt();
                    else if (typeof message.serverMsgId === "number")
                        object.serverMsgId = options.longs === String ? String(message.serverMsgId) : message.serverMsgId;
                    else
                        object.serverMsgId = options.longs === String ? $util.Long.prototype.toString.call(message.serverMsgId) : options.longs === Number ? new $util.LongBits(message.serverMsgId.low >>> 0, message.serverMsgId.high >>> 0).toNumber(true) : message.serverMsgId;
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.convId = typeof message.convId === "number" ? BigInt(message.convId) : $util.Long.fromBits(message.convId.low >>> 0, message.convId.high >>> 0, true).toBigInt();
                    else if (typeof message.convId === "number")
                        object.convId = options.longs === String ? String(message.convId) : message.convId;
                    else
                        object.convId = options.longs === String ? $util.Long.prototype.toString.call(message.convId) : options.longs === Number ? new $util.LongBits(message.convId.low >>> 0, message.convId.high >>> 0).toNumber(true) : message.convId;
                if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.seq = typeof message.seq === "number" ? BigInt(message.seq) : $util.Long.fromBits(message.seq.low >>> 0, message.seq.high >>> 0, true).toBigInt();
                    else if (typeof message.seq === "number")
                        object.seq = options.longs === String ? String(message.seq) : message.seq;
                    else
                        object.seq = options.longs === String ? $util.Long.prototype.toString.call(message.seq) : options.longs === Number ? new $util.LongBits(message.seq.low >>> 0, message.seq.high >>> 0).toNumber(true) : message.seq;
                if (message.createTimeMs != null && Object.hasOwnProperty.call(message, "createTimeMs"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.createTimeMs = typeof message.createTimeMs === "number" ? BigInt(message.createTimeMs) : $util.Long.fromBits(message.createTimeMs.low >>> 0, message.createTimeMs.high >>> 0, false).toBigInt();
                    else if (typeof message.createTimeMs === "number")
                        object.createTimeMs = options.longs === String ? String(message.createTimeMs) : message.createTimeMs;
                    else
                        object.createTimeMs = options.longs === String ? $util.Long.prototype.toString.call(message.createTimeMs) : options.longs === Number ? new $util.LongBits(message.createTimeMs.low >>> 0, message.createTimeMs.high >>> 0).toNumber() : message.createTimeMs;
                return object;
            };

            /**
             * Converts this MessageAckNotice to JSON.
             * @function toJSON
             * @memberof iris.v1.MessageAckNotice
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MessageAckNotice.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for MessageAckNotice
             * @function getTypeUrl
             * @memberof iris.v1.MessageAckNotice
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            MessageAckNotice.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.MessageAckNotice";
            };

            return MessageAckNotice;
        })();

        v1.ConvSyncReq = (function() {

            /**
             * Properties of a ConvSyncReq.
             * @memberof iris.v1
             * @interface IConvSyncReq
             * @property {Array.<iris.v1.IConvCursor>|null} [cursors] ConvSyncReq cursors
             * @property {number|null} [batchSize] ConvSyncReq batchSize
             */

            /**
             * Constructs a new ConvSyncReq.
             * @memberof iris.v1
             * @classdesc Represents a ConvSyncReq.
             * @implements IConvSyncReq
             * @constructor
             * @param {iris.v1.IConvSyncReq=} [properties] Properties to set
             */
            function ConvSyncReq(properties) {
                this.cursors = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ConvSyncReq cursors.
             * @member {Array.<iris.v1.IConvCursor>} cursors
             * @memberof iris.v1.ConvSyncReq
             * @instance
             */
            ConvSyncReq.prototype.cursors = $util.emptyArray;

            /**
             * ConvSyncReq batchSize.
             * @member {number} batchSize
             * @memberof iris.v1.ConvSyncReq
             * @instance
             */
            ConvSyncReq.prototype.batchSize = 0;

            /**
             * Creates a new ConvSyncReq instance using the specified properties.
             * @function create
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {iris.v1.IConvSyncReq=} [properties] Properties to set
             * @returns {iris.v1.ConvSyncReq} ConvSyncReq instance
             */
            ConvSyncReq.create = function create(properties) {
                return new ConvSyncReq(properties);
            };

            /**
             * Encodes the specified ConvSyncReq message. Does not implicitly {@link iris.v1.ConvSyncReq.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {iris.v1.IConvSyncReq} message ConvSyncReq message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvSyncReq.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.cursors != null && message.cursors.length)
                    for (let i = 0; i < message.cursors.length; ++i)
                        $root.iris.v1.ConvCursor.encode(message.cursors[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
                if (message.batchSize != null && Object.hasOwnProperty.call(message, "batchSize"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.batchSize);
                return writer;
            };

            /**
             * Encodes the specified ConvSyncReq message, length delimited. Does not implicitly {@link iris.v1.ConvSyncReq.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {iris.v1.IConvSyncReq} message ConvSyncReq message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvSyncReq.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a ConvSyncReq message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.ConvSyncReq} ConvSyncReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvSyncReq.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.ConvSyncReq();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.cursors && message.cursors.length))
                                message.cursors = [];
                            message.cursors.push($root.iris.v1.ConvCursor.decode(reader, reader.uint32(), undefined, long + 1));
                            break;
                        }
                    case 2: {
                            message.batchSize = reader.uint32();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a ConvSyncReq message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.ConvSyncReq} ConvSyncReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvSyncReq.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ConvSyncReq message.
             * @function verify
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ConvSyncReq.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.cursors != null && Object.hasOwnProperty.call(message, "cursors")) {
                    if (!Array.isArray(message.cursors))
                        return "cursors: array expected";
                    for (let i = 0; i < message.cursors.length; ++i) {
                        let error = $root.iris.v1.ConvCursor.verify(message.cursors[i], long + 1);
                        if (error)
                            return "cursors." + error;
                    }
                }
                if (message.batchSize != null && Object.hasOwnProperty.call(message, "batchSize"))
                    if (!$util.isInteger(message.batchSize))
                        return "batchSize: integer expected";
                return null;
            };

            /**
             * Creates a ConvSyncReq message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.ConvSyncReq} ConvSyncReq
             */
            ConvSyncReq.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.ConvSyncReq)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.ConvSyncReq: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.ConvSyncReq();
                if (object.cursors) {
                    if (!Array.isArray(object.cursors))
                        throw TypeError(".iris.v1.ConvSyncReq.cursors: array expected");
                    message.cursors = [];
                    for (let i = 0; i < object.cursors.length; ++i) {
                        if (!$util.isObject(object.cursors[i]))
                            throw TypeError(".iris.v1.ConvSyncReq.cursors: object expected");
                        message.cursors[i] = $root.iris.v1.ConvCursor.fromObject(object.cursors[i], long + 1);
                    }
                }
                if (object.batchSize != null)
                    message.batchSize = object.batchSize >>> 0;
                return message;
            };

            /**
             * Creates a plain object from a ConvSyncReq message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {iris.v1.ConvSyncReq} message ConvSyncReq
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ConvSyncReq.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.arrays || options.defaults)
                    object.cursors = [];
                if (options.defaults)
                    object.batchSize = 0;
                if (message.cursors && message.cursors.length) {
                    object.cursors = [];
                    for (let j = 0; j < message.cursors.length; ++j)
                        object.cursors[j] = $root.iris.v1.ConvCursor.toObject(message.cursors[j], options, q + 1);
                }
                if (message.batchSize != null && Object.hasOwnProperty.call(message, "batchSize"))
                    object.batchSize = message.batchSize;
                return object;
            };

            /**
             * Converts this ConvSyncReq to JSON.
             * @function toJSON
             * @memberof iris.v1.ConvSyncReq
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ConvSyncReq.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ConvSyncReq
             * @function getTypeUrl
             * @memberof iris.v1.ConvSyncReq
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ConvSyncReq.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.ConvSyncReq";
            };

            return ConvSyncReq;
        })();

        v1.ConvCursor = (function() {

            /**
             * Properties of a ConvCursor.
             * @memberof iris.v1
             * @interface IConvCursor
             * @property {number|Long|null} [convId] ConvCursor convId
             * @property {number|Long|null} [hasSeq] ConvCursor hasSeq
             */

            /**
             * Constructs a new ConvCursor.
             * @memberof iris.v1
             * @classdesc Represents a ConvCursor.
             * @implements IConvCursor
             * @constructor
             * @param {iris.v1.IConvCursor=} [properties] Properties to set
             */
            function ConvCursor(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ConvCursor convId.
             * @member {number|Long} convId
             * @memberof iris.v1.ConvCursor
             * @instance
             */
            ConvCursor.prototype.convId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ConvCursor hasSeq.
             * @member {number|Long} hasSeq
             * @memberof iris.v1.ConvCursor
             * @instance
             */
            ConvCursor.prototype.hasSeq = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new ConvCursor instance using the specified properties.
             * @function create
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {iris.v1.IConvCursor=} [properties] Properties to set
             * @returns {iris.v1.ConvCursor} ConvCursor instance
             */
            ConvCursor.create = function create(properties) {
                return new ConvCursor(properties);
            };

            /**
             * Encodes the specified ConvCursor message. Does not implicitly {@link iris.v1.ConvCursor.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {iris.v1.IConvCursor} message ConvCursor message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvCursor.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.convId);
                if (message.hasSeq != null && Object.hasOwnProperty.call(message, "hasSeq"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.hasSeq);
                return writer;
            };

            /**
             * Encodes the specified ConvCursor message, length delimited. Does not implicitly {@link iris.v1.ConvCursor.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {iris.v1.IConvCursor} message ConvCursor message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvCursor.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a ConvCursor message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.ConvCursor} ConvCursor
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvCursor.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.ConvCursor();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.convId = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.hasSeq = reader.uint64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a ConvCursor message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.ConvCursor} ConvCursor
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvCursor.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ConvCursor message.
             * @function verify
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ConvCursor.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (!$util.isInteger(message.convId) && !(message.convId && $util.isInteger(message.convId.low) && $util.isInteger(message.convId.high)))
                        return "convId: integer|Long expected";
                if (message.hasSeq != null && Object.hasOwnProperty.call(message, "hasSeq"))
                    if (!$util.isInteger(message.hasSeq) && !(message.hasSeq && $util.isInteger(message.hasSeq.low) && $util.isInteger(message.hasSeq.high)))
                        return "hasSeq: integer|Long expected";
                return null;
            };

            /**
             * Creates a ConvCursor message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.ConvCursor} ConvCursor
             */
            ConvCursor.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.ConvCursor)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.ConvCursor: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.ConvCursor();
                if (object.convId != null)
                    if ($util.Long)
                        message.convId = $util.Long.fromValue(object.convId, true);
                    else if (typeof object.convId === "string")
                        message.convId = parseInt(object.convId, 10);
                    else if (typeof object.convId === "number")
                        message.convId = object.convId;
                    else if (typeof object.convId === "object")
                        message.convId = new $util.LongBits(object.convId.low >>> 0, object.convId.high >>> 0).toNumber(true);
                if (object.hasSeq != null)
                    if ($util.Long)
                        message.hasSeq = $util.Long.fromValue(object.hasSeq, true);
                    else if (typeof object.hasSeq === "string")
                        message.hasSeq = parseInt(object.hasSeq, 10);
                    else if (typeof object.hasSeq === "number")
                        message.hasSeq = object.hasSeq;
                    else if (typeof object.hasSeq === "object")
                        message.hasSeq = new $util.LongBits(object.hasSeq.low >>> 0, object.hasSeq.high >>> 0).toNumber(true);
                return message;
            };

            /**
             * Creates a plain object from a ConvCursor message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {iris.v1.ConvCursor} message ConvCursor
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ConvCursor.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.convId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.convId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.hasSeq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.hasSeq = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                }
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.convId = typeof message.convId === "number" ? BigInt(message.convId) : $util.Long.fromBits(message.convId.low >>> 0, message.convId.high >>> 0, true).toBigInt();
                    else if (typeof message.convId === "number")
                        object.convId = options.longs === String ? String(message.convId) : message.convId;
                    else
                        object.convId = options.longs === String ? $util.Long.prototype.toString.call(message.convId) : options.longs === Number ? new $util.LongBits(message.convId.low >>> 0, message.convId.high >>> 0).toNumber(true) : message.convId;
                if (message.hasSeq != null && Object.hasOwnProperty.call(message, "hasSeq"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.hasSeq = typeof message.hasSeq === "number" ? BigInt(message.hasSeq) : $util.Long.fromBits(message.hasSeq.low >>> 0, message.hasSeq.high >>> 0, true).toBigInt();
                    else if (typeof message.hasSeq === "number")
                        object.hasSeq = options.longs === String ? String(message.hasSeq) : message.hasSeq;
                    else
                        object.hasSeq = options.longs === String ? $util.Long.prototype.toString.call(message.hasSeq) : options.longs === Number ? new $util.LongBits(message.hasSeq.low >>> 0, message.hasSeq.high >>> 0).toNumber(true) : message.hasSeq;
                return object;
            };

            /**
             * Converts this ConvCursor to JSON.
             * @function toJSON
             * @memberof iris.v1.ConvCursor
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ConvCursor.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ConvCursor
             * @function getTypeUrl
             * @memberof iris.v1.ConvCursor
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ConvCursor.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.ConvCursor";
            };

            return ConvCursor;
        })();

        v1.SyncMessage = (function() {

            /**
             * Properties of a SyncMessage.
             * @memberof iris.v1
             * @interface ISyncMessage
             * @property {number|Long|null} [id] SyncMessage id
             * @property {number|Long|null} [convId] SyncMessage convId
             * @property {number|Long|null} [senderId] SyncMessage senderId
             * @property {iris.v1.MsgType|null} [msgType] SyncMessage msgType
             * @property {string|null} [content] SyncMessage content
             * @property {number|Long|null} [seq] SyncMessage seq
             * @property {string|null} [clientMsgId] SyncMessage clientMsgId
             * @property {number|Long|null} [createTimeMs] SyncMessage createTimeMs
             */

            /**
             * Constructs a new SyncMessage.
             * @memberof iris.v1
             * @classdesc Represents a SyncMessage.
             * @implements ISyncMessage
             * @constructor
             * @param {iris.v1.ISyncMessage=} [properties] Properties to set
             */
            function SyncMessage(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * SyncMessage id.
             * @member {number|Long} id
             * @memberof iris.v1.SyncMessage
             * @instance
             */
            SyncMessage.prototype.id = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * SyncMessage convId.
             * @member {number|Long} convId
             * @memberof iris.v1.SyncMessage
             * @instance
             */
            SyncMessage.prototype.convId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * SyncMessage senderId.
             * @member {number|Long} senderId
             * @memberof iris.v1.SyncMessage
             * @instance
             */
            SyncMessage.prototype.senderId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * SyncMessage msgType.
             * @member {iris.v1.MsgType} msgType
             * @memberof iris.v1.SyncMessage
             * @instance
             */
            SyncMessage.prototype.msgType = 0;

            /**
             * SyncMessage content.
             * @member {string} content
             * @memberof iris.v1.SyncMessage
             * @instance
             */
            SyncMessage.prototype.content = "";

            /**
             * SyncMessage seq.
             * @member {number|Long} seq
             * @memberof iris.v1.SyncMessage
             * @instance
             */
            SyncMessage.prototype.seq = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * SyncMessage clientMsgId.
             * @member {string} clientMsgId
             * @memberof iris.v1.SyncMessage
             * @instance
             */
            SyncMessage.prototype.clientMsgId = "";

            /**
             * SyncMessage createTimeMs.
             * @member {number|Long} createTimeMs
             * @memberof iris.v1.SyncMessage
             * @instance
             */
            SyncMessage.prototype.createTimeMs = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

            /**
             * Creates a new SyncMessage instance using the specified properties.
             * @function create
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {iris.v1.ISyncMessage=} [properties] Properties to set
             * @returns {iris.v1.SyncMessage} SyncMessage instance
             */
            SyncMessage.create = function create(properties) {
                return new SyncMessage(properties);
            };

            /**
             * Encodes the specified SyncMessage message. Does not implicitly {@link iris.v1.SyncMessage.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {iris.v1.ISyncMessage} message SyncMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SyncMessage.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.id);
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.convId);
                if (message.senderId != null && Object.hasOwnProperty.call(message, "senderId"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.senderId);
                if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
                    writer.uint32(/* id 4, wireType 0 =*/32).int32(message.msgType);
                if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                    writer.uint32(/* id 5, wireType 2 =*/42).string(message.content);
                if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                    writer.uint32(/* id 6, wireType 0 =*/48).uint64(message.seq);
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    writer.uint32(/* id 7, wireType 2 =*/58).string(message.clientMsgId);
                if (message.createTimeMs != null && Object.hasOwnProperty.call(message, "createTimeMs"))
                    writer.uint32(/* id 8, wireType 0 =*/64).int64(message.createTimeMs);
                return writer;
            };

            /**
             * Encodes the specified SyncMessage message, length delimited. Does not implicitly {@link iris.v1.SyncMessage.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {iris.v1.ISyncMessage} message SyncMessage message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            SyncMessage.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a SyncMessage message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.SyncMessage} SyncMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SyncMessage.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.SyncMessage();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.id = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.convId = reader.uint64();
                            break;
                        }
                    case 3: {
                            message.senderId = reader.uint64();
                            break;
                        }
                    case 4: {
                            message.msgType = reader.int32();
                            break;
                        }
                    case 5: {
                            message.content = reader.string();
                            break;
                        }
                    case 6: {
                            message.seq = reader.uint64();
                            break;
                        }
                    case 7: {
                            message.clientMsgId = reader.string();
                            break;
                        }
                    case 8: {
                            message.createTimeMs = reader.int64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a SyncMessage message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.SyncMessage} SyncMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            SyncMessage.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a SyncMessage message.
             * @function verify
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            SyncMessage.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                        return "id: integer|Long expected";
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (!$util.isInteger(message.convId) && !(message.convId && $util.isInteger(message.convId.low) && $util.isInteger(message.convId.high)))
                        return "convId: integer|Long expected";
                if (message.senderId != null && Object.hasOwnProperty.call(message, "senderId"))
                    if (!$util.isInteger(message.senderId) && !(message.senderId && $util.isInteger(message.senderId.low) && $util.isInteger(message.senderId.high)))
                        return "senderId: integer|Long expected";
                if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
                    switch (message.msgType) {
                    default:
                        return "msgType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        break;
                    }
                if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                    if (!$util.isString(message.content))
                        return "content: string expected";
                if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                    if (!$util.isInteger(message.seq) && !(message.seq && $util.isInteger(message.seq.low) && $util.isInteger(message.seq.high)))
                        return "seq: integer|Long expected";
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    if (!$util.isString(message.clientMsgId))
                        return "clientMsgId: string expected";
                if (message.createTimeMs != null && Object.hasOwnProperty.call(message, "createTimeMs"))
                    if (!$util.isInteger(message.createTimeMs) && !(message.createTimeMs && $util.isInteger(message.createTimeMs.low) && $util.isInteger(message.createTimeMs.high)))
                        return "createTimeMs: integer|Long expected";
                return null;
            };

            /**
             * Creates a SyncMessage message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.SyncMessage} SyncMessage
             */
            SyncMessage.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.SyncMessage)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.SyncMessage: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.SyncMessage();
                if (object.id != null)
                    if ($util.Long)
                        message.id = $util.Long.fromValue(object.id, true);
                    else if (typeof object.id === "string")
                        message.id = parseInt(object.id, 10);
                    else if (typeof object.id === "number")
                        message.id = object.id;
                    else if (typeof object.id === "object")
                        message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber(true);
                if (object.convId != null)
                    if ($util.Long)
                        message.convId = $util.Long.fromValue(object.convId, true);
                    else if (typeof object.convId === "string")
                        message.convId = parseInt(object.convId, 10);
                    else if (typeof object.convId === "number")
                        message.convId = object.convId;
                    else if (typeof object.convId === "object")
                        message.convId = new $util.LongBits(object.convId.low >>> 0, object.convId.high >>> 0).toNumber(true);
                if (object.senderId != null)
                    if ($util.Long)
                        message.senderId = $util.Long.fromValue(object.senderId, true);
                    else if (typeof object.senderId === "string")
                        message.senderId = parseInt(object.senderId, 10);
                    else if (typeof object.senderId === "number")
                        message.senderId = object.senderId;
                    else if (typeof object.senderId === "object")
                        message.senderId = new $util.LongBits(object.senderId.low >>> 0, object.senderId.high >>> 0).toNumber(true);
                switch (object.msgType) {
                default:
                    if (typeof object.msgType === "number") {
                        message.msgType = object.msgType;
                        break;
                    }
                    break;
                case "MSG_TYPE_UNSPECIFIED":
                case 0:
                    message.msgType = 0;
                    break;
                case "TEXT":
                case 1:
                    message.msgType = 1;
                    break;
                case "IMAGE":
                case 2:
                    message.msgType = 2;
                    break;
                case "FILE":
                case 3:
                    message.msgType = 3;
                    break;
                case "SYSTEM":
                case 4:
                    message.msgType = 4;
                    break;
                }
                if (object.content != null)
                    message.content = String(object.content);
                if (object.seq != null)
                    if ($util.Long)
                        message.seq = $util.Long.fromValue(object.seq, true);
                    else if (typeof object.seq === "string")
                        message.seq = parseInt(object.seq, 10);
                    else if (typeof object.seq === "number")
                        message.seq = object.seq;
                    else if (typeof object.seq === "object")
                        message.seq = new $util.LongBits(object.seq.low >>> 0, object.seq.high >>> 0).toNumber(true);
                if (object.clientMsgId != null)
                    message.clientMsgId = String(object.clientMsgId);
                if (object.createTimeMs != null)
                    if ($util.Long)
                        message.createTimeMs = $util.Long.fromValue(object.createTimeMs, false);
                    else if (typeof object.createTimeMs === "string")
                        message.createTimeMs = parseInt(object.createTimeMs, 10);
                    else if (typeof object.createTimeMs === "number")
                        message.createTimeMs = object.createTimeMs;
                    else if (typeof object.createTimeMs === "object")
                        message.createTimeMs = new $util.LongBits(object.createTimeMs.low >>> 0, object.createTimeMs.high >>> 0).toNumber();
                return message;
            };

            /**
             * Creates a plain object from a SyncMessage message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {iris.v1.SyncMessage} message SyncMessage
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            SyncMessage.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.id = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.convId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.convId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.senderId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.senderId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.msgType = options.enums === String ? "MSG_TYPE_UNSPECIFIED" : 0;
                    object.content = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.seq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.seq = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.clientMsgId = "";
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, false);
                        object.createTimeMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.createTimeMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                }
                if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.id = typeof message.id === "number" ? BigInt(message.id) : $util.Long.fromBits(message.id.low >>> 0, message.id.high >>> 0, true).toBigInt();
                    else if (typeof message.id === "number")
                        object.id = options.longs === String ? String(message.id) : message.id;
                    else
                        object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber(true) : message.id;
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.convId = typeof message.convId === "number" ? BigInt(message.convId) : $util.Long.fromBits(message.convId.low >>> 0, message.convId.high >>> 0, true).toBigInt();
                    else if (typeof message.convId === "number")
                        object.convId = options.longs === String ? String(message.convId) : message.convId;
                    else
                        object.convId = options.longs === String ? $util.Long.prototype.toString.call(message.convId) : options.longs === Number ? new $util.LongBits(message.convId.low >>> 0, message.convId.high >>> 0).toNumber(true) : message.convId;
                if (message.senderId != null && Object.hasOwnProperty.call(message, "senderId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.senderId = typeof message.senderId === "number" ? BigInt(message.senderId) : $util.Long.fromBits(message.senderId.low >>> 0, message.senderId.high >>> 0, true).toBigInt();
                    else if (typeof message.senderId === "number")
                        object.senderId = options.longs === String ? String(message.senderId) : message.senderId;
                    else
                        object.senderId = options.longs === String ? $util.Long.prototype.toString.call(message.senderId) : options.longs === Number ? new $util.LongBits(message.senderId.low >>> 0, message.senderId.high >>> 0).toNumber(true) : message.senderId;
                if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
                    object.msgType = options.enums === String ? $root.iris.v1.MsgType[message.msgType] === undefined ? message.msgType : $root.iris.v1.MsgType[message.msgType] : message.msgType;
                if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                    object.content = message.content;
                if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.seq = typeof message.seq === "number" ? BigInt(message.seq) : $util.Long.fromBits(message.seq.low >>> 0, message.seq.high >>> 0, true).toBigInt();
                    else if (typeof message.seq === "number")
                        object.seq = options.longs === String ? String(message.seq) : message.seq;
                    else
                        object.seq = options.longs === String ? $util.Long.prototype.toString.call(message.seq) : options.longs === Number ? new $util.LongBits(message.seq.low >>> 0, message.seq.high >>> 0).toNumber(true) : message.seq;
                if (message.clientMsgId != null && Object.hasOwnProperty.call(message, "clientMsgId"))
                    object.clientMsgId = message.clientMsgId;
                if (message.createTimeMs != null && Object.hasOwnProperty.call(message, "createTimeMs"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.createTimeMs = typeof message.createTimeMs === "number" ? BigInt(message.createTimeMs) : $util.Long.fromBits(message.createTimeMs.low >>> 0, message.createTimeMs.high >>> 0, false).toBigInt();
                    else if (typeof message.createTimeMs === "number")
                        object.createTimeMs = options.longs === String ? String(message.createTimeMs) : message.createTimeMs;
                    else
                        object.createTimeMs = options.longs === String ? $util.Long.prototype.toString.call(message.createTimeMs) : options.longs === Number ? new $util.LongBits(message.createTimeMs.low >>> 0, message.createTimeMs.high >>> 0).toNumber() : message.createTimeMs;
                return object;
            };

            /**
             * Converts this SyncMessage to JSON.
             * @function toJSON
             * @memberof iris.v1.SyncMessage
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            SyncMessage.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for SyncMessage
             * @function getTypeUrl
             * @memberof iris.v1.SyncMessage
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            SyncMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.SyncMessage";
            };

            return SyncMessage;
        })();

        v1.ConvSyncResp = (function() {

            /**
             * Properties of a ConvSyncResp.
             * @memberof iris.v1
             * @interface IConvSyncResp
             * @property {number|Long|null} [convId] ConvSyncResp convId
             * @property {Array.<iris.v1.ISyncMessage>|null} [messages] ConvSyncResp messages
             * @property {boolean|null} [hasMore] ConvSyncResp hasMore
             */

            /**
             * Constructs a new ConvSyncResp.
             * @memberof iris.v1
             * @classdesc Represents a ConvSyncResp.
             * @implements IConvSyncResp
             * @constructor
             * @param {iris.v1.IConvSyncResp=} [properties] Properties to set
             */
            function ConvSyncResp(properties) {
                this.messages = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ConvSyncResp convId.
             * @member {number|Long} convId
             * @memberof iris.v1.ConvSyncResp
             * @instance
             */
            ConvSyncResp.prototype.convId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ConvSyncResp messages.
             * @member {Array.<iris.v1.ISyncMessage>} messages
             * @memberof iris.v1.ConvSyncResp
             * @instance
             */
            ConvSyncResp.prototype.messages = $util.emptyArray;

            /**
             * ConvSyncResp hasMore.
             * @member {boolean} hasMore
             * @memberof iris.v1.ConvSyncResp
             * @instance
             */
            ConvSyncResp.prototype.hasMore = false;

            /**
             * Creates a new ConvSyncResp instance using the specified properties.
             * @function create
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {iris.v1.IConvSyncResp=} [properties] Properties to set
             * @returns {iris.v1.ConvSyncResp} ConvSyncResp instance
             */
            ConvSyncResp.create = function create(properties) {
                return new ConvSyncResp(properties);
            };

            /**
             * Encodes the specified ConvSyncResp message. Does not implicitly {@link iris.v1.ConvSyncResp.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {iris.v1.IConvSyncResp} message ConvSyncResp message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvSyncResp.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.convId);
                if (message.messages != null && message.messages.length)
                    for (let i = 0; i < message.messages.length; ++i)
                        $root.iris.v1.SyncMessage.encode(message.messages[i], writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
                if (message.hasMore != null && Object.hasOwnProperty.call(message, "hasMore"))
                    writer.uint32(/* id 3, wireType 0 =*/24).bool(message.hasMore);
                return writer;
            };

            /**
             * Encodes the specified ConvSyncResp message, length delimited. Does not implicitly {@link iris.v1.ConvSyncResp.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {iris.v1.IConvSyncResp} message ConvSyncResp message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvSyncResp.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a ConvSyncResp message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.ConvSyncResp} ConvSyncResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvSyncResp.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.ConvSyncResp();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.convId = reader.uint64();
                            break;
                        }
                    case 2: {
                            if (!(message.messages && message.messages.length))
                                message.messages = [];
                            message.messages.push($root.iris.v1.SyncMessage.decode(reader, reader.uint32(), undefined, long + 1));
                            break;
                        }
                    case 3: {
                            message.hasMore = reader.bool();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a ConvSyncResp message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.ConvSyncResp} ConvSyncResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvSyncResp.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ConvSyncResp message.
             * @function verify
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ConvSyncResp.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (!$util.isInteger(message.convId) && !(message.convId && $util.isInteger(message.convId.low) && $util.isInteger(message.convId.high)))
                        return "convId: integer|Long expected";
                if (message.messages != null && Object.hasOwnProperty.call(message, "messages")) {
                    if (!Array.isArray(message.messages))
                        return "messages: array expected";
                    for (let i = 0; i < message.messages.length; ++i) {
                        let error = $root.iris.v1.SyncMessage.verify(message.messages[i], long + 1);
                        if (error)
                            return "messages." + error;
                    }
                }
                if (message.hasMore != null && Object.hasOwnProperty.call(message, "hasMore"))
                    if (typeof message.hasMore !== "boolean")
                        return "hasMore: boolean expected";
                return null;
            };

            /**
             * Creates a ConvSyncResp message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.ConvSyncResp} ConvSyncResp
             */
            ConvSyncResp.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.ConvSyncResp)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.ConvSyncResp: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.ConvSyncResp();
                if (object.convId != null)
                    if ($util.Long)
                        message.convId = $util.Long.fromValue(object.convId, true);
                    else if (typeof object.convId === "string")
                        message.convId = parseInt(object.convId, 10);
                    else if (typeof object.convId === "number")
                        message.convId = object.convId;
                    else if (typeof object.convId === "object")
                        message.convId = new $util.LongBits(object.convId.low >>> 0, object.convId.high >>> 0).toNumber(true);
                if (object.messages) {
                    if (!Array.isArray(object.messages))
                        throw TypeError(".iris.v1.ConvSyncResp.messages: array expected");
                    message.messages = [];
                    for (let i = 0; i < object.messages.length; ++i) {
                        if (!$util.isObject(object.messages[i]))
                            throw TypeError(".iris.v1.ConvSyncResp.messages: object expected");
                        message.messages[i] = $root.iris.v1.SyncMessage.fromObject(object.messages[i], long + 1);
                    }
                }
                if (object.hasMore != null)
                    message.hasMore = Boolean(object.hasMore);
                return message;
            };

            /**
             * Creates a plain object from a ConvSyncResp message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {iris.v1.ConvSyncResp} message ConvSyncResp
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ConvSyncResp.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.arrays || options.defaults)
                    object.messages = [];
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.convId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.convId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.hasMore = false;
                }
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.convId = typeof message.convId === "number" ? BigInt(message.convId) : $util.Long.fromBits(message.convId.low >>> 0, message.convId.high >>> 0, true).toBigInt();
                    else if (typeof message.convId === "number")
                        object.convId = options.longs === String ? String(message.convId) : message.convId;
                    else
                        object.convId = options.longs === String ? $util.Long.prototype.toString.call(message.convId) : options.longs === Number ? new $util.LongBits(message.convId.low >>> 0, message.convId.high >>> 0).toNumber(true) : message.convId;
                if (message.messages && message.messages.length) {
                    object.messages = [];
                    for (let j = 0; j < message.messages.length; ++j)
                        object.messages[j] = $root.iris.v1.SyncMessage.toObject(message.messages[j], options, q + 1);
                }
                if (message.hasMore != null && Object.hasOwnProperty.call(message, "hasMore"))
                    object.hasMore = message.hasMore;
                return object;
            };

            /**
             * Converts this ConvSyncResp to JSON.
             * @function toJSON
             * @memberof iris.v1.ConvSyncResp
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ConvSyncResp.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ConvSyncResp
             * @function getTypeUrl
             * @memberof iris.v1.ConvSyncResp
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ConvSyncResp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.ConvSyncResp";
            };

            return ConvSyncResp;
        })();

        v1.ConvSyncBatchResp = (function() {

            /**
             * Properties of a ConvSyncBatchResp.
             * @memberof iris.v1
             * @interface IConvSyncBatchResp
             * @property {Array.<iris.v1.IConvSyncResp>|null} [convs] ConvSyncBatchResp convs
             */

            /**
             * Constructs a new ConvSyncBatchResp.
             * @memberof iris.v1
             * @classdesc Represents a ConvSyncBatchResp.
             * @implements IConvSyncBatchResp
             * @constructor
             * @param {iris.v1.IConvSyncBatchResp=} [properties] Properties to set
             */
            function ConvSyncBatchResp(properties) {
                this.convs = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ConvSyncBatchResp convs.
             * @member {Array.<iris.v1.IConvSyncResp>} convs
             * @memberof iris.v1.ConvSyncBatchResp
             * @instance
             */
            ConvSyncBatchResp.prototype.convs = $util.emptyArray;

            /**
             * Creates a new ConvSyncBatchResp instance using the specified properties.
             * @function create
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {iris.v1.IConvSyncBatchResp=} [properties] Properties to set
             * @returns {iris.v1.ConvSyncBatchResp} ConvSyncBatchResp instance
             */
            ConvSyncBatchResp.create = function create(properties) {
                return new ConvSyncBatchResp(properties);
            };

            /**
             * Encodes the specified ConvSyncBatchResp message. Does not implicitly {@link iris.v1.ConvSyncBatchResp.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {iris.v1.IConvSyncBatchResp} message ConvSyncBatchResp message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvSyncBatchResp.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.convs != null && message.convs.length)
                    for (let i = 0; i < message.convs.length; ++i)
                        $root.iris.v1.ConvSyncResp.encode(message.convs[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ConvSyncBatchResp message, length delimited. Does not implicitly {@link iris.v1.ConvSyncBatchResp.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {iris.v1.IConvSyncBatchResp} message ConvSyncBatchResp message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvSyncBatchResp.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a ConvSyncBatchResp message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.ConvSyncBatchResp} ConvSyncBatchResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvSyncBatchResp.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.ConvSyncBatchResp();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.convs && message.convs.length))
                                message.convs = [];
                            message.convs.push($root.iris.v1.ConvSyncResp.decode(reader, reader.uint32(), undefined, long + 1));
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a ConvSyncBatchResp message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.ConvSyncBatchResp} ConvSyncBatchResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvSyncBatchResp.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ConvSyncBatchResp message.
             * @function verify
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ConvSyncBatchResp.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.convs != null && Object.hasOwnProperty.call(message, "convs")) {
                    if (!Array.isArray(message.convs))
                        return "convs: array expected";
                    for (let i = 0; i < message.convs.length; ++i) {
                        let error = $root.iris.v1.ConvSyncResp.verify(message.convs[i], long + 1);
                        if (error)
                            return "convs." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a ConvSyncBatchResp message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.ConvSyncBatchResp} ConvSyncBatchResp
             */
            ConvSyncBatchResp.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.ConvSyncBatchResp)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.ConvSyncBatchResp: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.ConvSyncBatchResp();
                if (object.convs) {
                    if (!Array.isArray(object.convs))
                        throw TypeError(".iris.v1.ConvSyncBatchResp.convs: array expected");
                    message.convs = [];
                    for (let i = 0; i < object.convs.length; ++i) {
                        if (!$util.isObject(object.convs[i]))
                            throw TypeError(".iris.v1.ConvSyncBatchResp.convs: object expected");
                        message.convs[i] = $root.iris.v1.ConvSyncResp.fromObject(object.convs[i], long + 1);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a ConvSyncBatchResp message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {iris.v1.ConvSyncBatchResp} message ConvSyncBatchResp
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ConvSyncBatchResp.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.arrays || options.defaults)
                    object.convs = [];
                if (message.convs && message.convs.length) {
                    object.convs = [];
                    for (let j = 0; j < message.convs.length; ++j)
                        object.convs[j] = $root.iris.v1.ConvSyncResp.toObject(message.convs[j], options, q + 1);
                }
                return object;
            };

            /**
             * Converts this ConvSyncBatchResp to JSON.
             * @function toJSON
             * @memberof iris.v1.ConvSyncBatchResp
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ConvSyncBatchResp.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ConvSyncBatchResp
             * @function getTypeUrl
             * @memberof iris.v1.ConvSyncBatchResp
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ConvSyncBatchResp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.ConvSyncBatchResp";
            };

            return ConvSyncBatchResp;
        })();

        v1.ConvReadReq = (function() {

            /**
             * Properties of a ConvReadReq.
             * @memberof iris.v1
             * @interface IConvReadReq
             * @property {number|Long|null} [convId] ConvReadReq convId
             * @property {number|Long|null} [readSeq] ConvReadReq readSeq
             */

            /**
             * Constructs a new ConvReadReq.
             * @memberof iris.v1
             * @classdesc Represents a ConvReadReq.
             * @implements IConvReadReq
             * @constructor
             * @param {iris.v1.IConvReadReq=} [properties] Properties to set
             */
            function ConvReadReq(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ConvReadReq convId.
             * @member {number|Long} convId
             * @memberof iris.v1.ConvReadReq
             * @instance
             */
            ConvReadReq.prototype.convId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ConvReadReq readSeq.
             * @member {number|Long} readSeq
             * @memberof iris.v1.ConvReadReq
             * @instance
             */
            ConvReadReq.prototype.readSeq = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new ConvReadReq instance using the specified properties.
             * @function create
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {iris.v1.IConvReadReq=} [properties] Properties to set
             * @returns {iris.v1.ConvReadReq} ConvReadReq instance
             */
            ConvReadReq.create = function create(properties) {
                return new ConvReadReq(properties);
            };

            /**
             * Encodes the specified ConvReadReq message. Does not implicitly {@link iris.v1.ConvReadReq.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {iris.v1.IConvReadReq} message ConvReadReq message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvReadReq.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.convId);
                if (message.readSeq != null && Object.hasOwnProperty.call(message, "readSeq"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.readSeq);
                return writer;
            };

            /**
             * Encodes the specified ConvReadReq message, length delimited. Does not implicitly {@link iris.v1.ConvReadReq.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {iris.v1.IConvReadReq} message ConvReadReq message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvReadReq.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a ConvReadReq message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.ConvReadReq} ConvReadReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvReadReq.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.ConvReadReq();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.convId = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.readSeq = reader.uint64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a ConvReadReq message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.ConvReadReq} ConvReadReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvReadReq.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ConvReadReq message.
             * @function verify
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ConvReadReq.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (!$util.isInteger(message.convId) && !(message.convId && $util.isInteger(message.convId.low) && $util.isInteger(message.convId.high)))
                        return "convId: integer|Long expected";
                if (message.readSeq != null && Object.hasOwnProperty.call(message, "readSeq"))
                    if (!$util.isInteger(message.readSeq) && !(message.readSeq && $util.isInteger(message.readSeq.low) && $util.isInteger(message.readSeq.high)))
                        return "readSeq: integer|Long expected";
                return null;
            };

            /**
             * Creates a ConvReadReq message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.ConvReadReq} ConvReadReq
             */
            ConvReadReq.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.ConvReadReq)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.ConvReadReq: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.ConvReadReq();
                if (object.convId != null)
                    if ($util.Long)
                        message.convId = $util.Long.fromValue(object.convId, true);
                    else if (typeof object.convId === "string")
                        message.convId = parseInt(object.convId, 10);
                    else if (typeof object.convId === "number")
                        message.convId = object.convId;
                    else if (typeof object.convId === "object")
                        message.convId = new $util.LongBits(object.convId.low >>> 0, object.convId.high >>> 0).toNumber(true);
                if (object.readSeq != null)
                    if ($util.Long)
                        message.readSeq = $util.Long.fromValue(object.readSeq, true);
                    else if (typeof object.readSeq === "string")
                        message.readSeq = parseInt(object.readSeq, 10);
                    else if (typeof object.readSeq === "number")
                        message.readSeq = object.readSeq;
                    else if (typeof object.readSeq === "object")
                        message.readSeq = new $util.LongBits(object.readSeq.low >>> 0, object.readSeq.high >>> 0).toNumber(true);
                return message;
            };

            /**
             * Creates a plain object from a ConvReadReq message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {iris.v1.ConvReadReq} message ConvReadReq
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ConvReadReq.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.convId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.convId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.readSeq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.readSeq = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                }
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.convId = typeof message.convId === "number" ? BigInt(message.convId) : $util.Long.fromBits(message.convId.low >>> 0, message.convId.high >>> 0, true).toBigInt();
                    else if (typeof message.convId === "number")
                        object.convId = options.longs === String ? String(message.convId) : message.convId;
                    else
                        object.convId = options.longs === String ? $util.Long.prototype.toString.call(message.convId) : options.longs === Number ? new $util.LongBits(message.convId.low >>> 0, message.convId.high >>> 0).toNumber(true) : message.convId;
                if (message.readSeq != null && Object.hasOwnProperty.call(message, "readSeq"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.readSeq = typeof message.readSeq === "number" ? BigInt(message.readSeq) : $util.Long.fromBits(message.readSeq.low >>> 0, message.readSeq.high >>> 0, true).toBigInt();
                    else if (typeof message.readSeq === "number")
                        object.readSeq = options.longs === String ? String(message.readSeq) : message.readSeq;
                    else
                        object.readSeq = options.longs === String ? $util.Long.prototype.toString.call(message.readSeq) : options.longs === Number ? new $util.LongBits(message.readSeq.low >>> 0, message.readSeq.high >>> 0).toNumber(true) : message.readSeq;
                return object;
            };

            /**
             * Converts this ConvReadReq to JSON.
             * @function toJSON
             * @memberof iris.v1.ConvReadReq
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ConvReadReq.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ConvReadReq
             * @function getTypeUrl
             * @memberof iris.v1.ConvReadReq
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ConvReadReq.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.ConvReadReq";
            };

            return ConvReadReq;
        })();

        v1.ConvReadNotice = (function() {

            /**
             * Properties of a ConvReadNotice.
             * @memberof iris.v1
             * @interface IConvReadNotice
             * @property {number|Long|null} [convId] ConvReadNotice convId
             * @property {number|Long|null} [userId] ConvReadNotice userId
             * @property {number|Long|null} [readSeq] ConvReadNotice readSeq
             */

            /**
             * Constructs a new ConvReadNotice.
             * @memberof iris.v1
             * @classdesc Represents a ConvReadNotice.
             * @implements IConvReadNotice
             * @constructor
             * @param {iris.v1.IConvReadNotice=} [properties] Properties to set
             */
            function ConvReadNotice(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ConvReadNotice convId.
             * @member {number|Long} convId
             * @memberof iris.v1.ConvReadNotice
             * @instance
             */
            ConvReadNotice.prototype.convId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ConvReadNotice userId.
             * @member {number|Long} userId
             * @memberof iris.v1.ConvReadNotice
             * @instance
             */
            ConvReadNotice.prototype.userId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ConvReadNotice readSeq.
             * @member {number|Long} readSeq
             * @memberof iris.v1.ConvReadNotice
             * @instance
             */
            ConvReadNotice.prototype.readSeq = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * Creates a new ConvReadNotice instance using the specified properties.
             * @function create
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {iris.v1.IConvReadNotice=} [properties] Properties to set
             * @returns {iris.v1.ConvReadNotice} ConvReadNotice instance
             */
            ConvReadNotice.create = function create(properties) {
                return new ConvReadNotice(properties);
            };

            /**
             * Encodes the specified ConvReadNotice message. Does not implicitly {@link iris.v1.ConvReadNotice.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {iris.v1.IConvReadNotice} message ConvReadNotice message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvReadNotice.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.convId);
                if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.userId);
                if (message.readSeq != null && Object.hasOwnProperty.call(message, "readSeq"))
                    writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.readSeq);
                return writer;
            };

            /**
             * Encodes the specified ConvReadNotice message, length delimited. Does not implicitly {@link iris.v1.ConvReadNotice.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {iris.v1.IConvReadNotice} message ConvReadNotice message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ConvReadNotice.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a ConvReadNotice message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.ConvReadNotice} ConvReadNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvReadNotice.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.ConvReadNotice();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.convId = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.userId = reader.uint64();
                            break;
                        }
                    case 3: {
                            message.readSeq = reader.uint64();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a ConvReadNotice message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.ConvReadNotice} ConvReadNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ConvReadNotice.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ConvReadNotice message.
             * @function verify
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ConvReadNotice.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (!$util.isInteger(message.convId) && !(message.convId && $util.isInteger(message.convId.low) && $util.isInteger(message.convId.high)))
                        return "convId: integer|Long expected";
                if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                    if (!$util.isInteger(message.userId) && !(message.userId && $util.isInteger(message.userId.low) && $util.isInteger(message.userId.high)))
                        return "userId: integer|Long expected";
                if (message.readSeq != null && Object.hasOwnProperty.call(message, "readSeq"))
                    if (!$util.isInteger(message.readSeq) && !(message.readSeq && $util.isInteger(message.readSeq.low) && $util.isInteger(message.readSeq.high)))
                        return "readSeq: integer|Long expected";
                return null;
            };

            /**
             * Creates a ConvReadNotice message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.ConvReadNotice} ConvReadNotice
             */
            ConvReadNotice.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.ConvReadNotice)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.ConvReadNotice: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.ConvReadNotice();
                if (object.convId != null)
                    if ($util.Long)
                        message.convId = $util.Long.fromValue(object.convId, true);
                    else if (typeof object.convId === "string")
                        message.convId = parseInt(object.convId, 10);
                    else if (typeof object.convId === "number")
                        message.convId = object.convId;
                    else if (typeof object.convId === "object")
                        message.convId = new $util.LongBits(object.convId.low >>> 0, object.convId.high >>> 0).toNumber(true);
                if (object.userId != null)
                    if ($util.Long)
                        message.userId = $util.Long.fromValue(object.userId, true);
                    else if (typeof object.userId === "string")
                        message.userId = parseInt(object.userId, 10);
                    else if (typeof object.userId === "number")
                        message.userId = object.userId;
                    else if (typeof object.userId === "object")
                        message.userId = new $util.LongBits(object.userId.low >>> 0, object.userId.high >>> 0).toNumber(true);
                if (object.readSeq != null)
                    if ($util.Long)
                        message.readSeq = $util.Long.fromValue(object.readSeq, true);
                    else if (typeof object.readSeq === "string")
                        message.readSeq = parseInt(object.readSeq, 10);
                    else if (typeof object.readSeq === "number")
                        message.readSeq = object.readSeq;
                    else if (typeof object.readSeq === "object")
                        message.readSeq = new $util.LongBits(object.readSeq.low >>> 0, object.readSeq.high >>> 0).toNumber(true);
                return message;
            };

            /**
             * Creates a plain object from a ConvReadNotice message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {iris.v1.ConvReadNotice} message ConvReadNotice
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ConvReadNotice.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.convId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.convId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.userId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.userId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.readSeq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.readSeq = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                }
                if (message.convId != null && Object.hasOwnProperty.call(message, "convId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.convId = typeof message.convId === "number" ? BigInt(message.convId) : $util.Long.fromBits(message.convId.low >>> 0, message.convId.high >>> 0, true).toBigInt();
                    else if (typeof message.convId === "number")
                        object.convId = options.longs === String ? String(message.convId) : message.convId;
                    else
                        object.convId = options.longs === String ? $util.Long.prototype.toString.call(message.convId) : options.longs === Number ? new $util.LongBits(message.convId.low >>> 0, message.convId.high >>> 0).toNumber(true) : message.convId;
                if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.userId = typeof message.userId === "number" ? BigInt(message.userId) : $util.Long.fromBits(message.userId.low >>> 0, message.userId.high >>> 0, true).toBigInt();
                    else if (typeof message.userId === "number")
                        object.userId = options.longs === String ? String(message.userId) : message.userId;
                    else
                        object.userId = options.longs === String ? $util.Long.prototype.toString.call(message.userId) : options.longs === Number ? new $util.LongBits(message.userId.low >>> 0, message.userId.high >>> 0).toNumber(true) : message.userId;
                if (message.readSeq != null && Object.hasOwnProperty.call(message, "readSeq"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.readSeq = typeof message.readSeq === "number" ? BigInt(message.readSeq) : $util.Long.fromBits(message.readSeq.low >>> 0, message.readSeq.high >>> 0, true).toBigInt();
                    else if (typeof message.readSeq === "number")
                        object.readSeq = options.longs === String ? String(message.readSeq) : message.readSeq;
                    else
                        object.readSeq = options.longs === String ? $util.Long.prototype.toString.call(message.readSeq) : options.longs === Number ? new $util.LongBits(message.readSeq.low >>> 0, message.readSeq.high >>> 0).toNumber(true) : message.readSeq;
                return object;
            };

            /**
             * Converts this ConvReadNotice to JSON.
             * @function toJSON
             * @memberof iris.v1.ConvReadNotice
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ConvReadNotice.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ConvReadNotice
             * @function getTypeUrl
             * @memberof iris.v1.ConvReadNotice
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ConvReadNotice.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.ConvReadNotice";
            };

            return ConvReadNotice;
        })();

        v1.MessagePush = (function() {

            /**
             * Properties of a MessagePush.
             * @memberof iris.v1
             * @interface IMessagePush
             * @property {iris.v1.ISyncMessage|null} [message] MessagePush message
             * @property {string|null} [senderNickname] MessagePush senderNickname
             * @property {string|null} [senderAvatar] MessagePush senderAvatar
             */

            /**
             * Constructs a new MessagePush.
             * @memberof iris.v1
             * @classdesc Represents a MessagePush.
             * @implements IMessagePush
             * @constructor
             * @param {iris.v1.IMessagePush=} [properties] Properties to set
             */
            function MessagePush(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MessagePush message.
             * @member {iris.v1.ISyncMessage|null|undefined} message
             * @memberof iris.v1.MessagePush
             * @instance
             */
            MessagePush.prototype.message = null;

            /**
             * MessagePush senderNickname.
             * @member {string} senderNickname
             * @memberof iris.v1.MessagePush
             * @instance
             */
            MessagePush.prototype.senderNickname = "";

            /**
             * MessagePush senderAvatar.
             * @member {string} senderAvatar
             * @memberof iris.v1.MessagePush
             * @instance
             */
            MessagePush.prototype.senderAvatar = "";

            /**
             * Creates a new MessagePush instance using the specified properties.
             * @function create
             * @memberof iris.v1.MessagePush
             * @static
             * @param {iris.v1.IMessagePush=} [properties] Properties to set
             * @returns {iris.v1.MessagePush} MessagePush instance
             */
            MessagePush.create = function create(properties) {
                return new MessagePush(properties);
            };

            /**
             * Encodes the specified MessagePush message. Does not implicitly {@link iris.v1.MessagePush.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.MessagePush
             * @static
             * @param {iris.v1.IMessagePush} message MessagePush message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessagePush.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    $root.iris.v1.SyncMessage.encode(message.message, writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
                if (message.senderNickname != null && Object.hasOwnProperty.call(message, "senderNickname"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.senderNickname);
                if (message.senderAvatar != null && Object.hasOwnProperty.call(message, "senderAvatar"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.senderAvatar);
                return writer;
            };

            /**
             * Encodes the specified MessagePush message, length delimited. Does not implicitly {@link iris.v1.MessagePush.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.MessagePush
             * @static
             * @param {iris.v1.IMessagePush} message MessagePush message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MessagePush.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a MessagePush message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.MessagePush
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.MessagePush} MessagePush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessagePush.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.MessagePush();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.message = $root.iris.v1.SyncMessage.decode(reader, reader.uint32(), undefined, long + 1);
                            break;
                        }
                    case 2: {
                            message.senderNickname = reader.string();
                            break;
                        }
                    case 3: {
                            message.senderAvatar = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a MessagePush message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.MessagePush
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.MessagePush} MessagePush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MessagePush.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MessagePush message.
             * @function verify
             * @memberof iris.v1.MessagePush
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MessagePush.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.message != null && Object.hasOwnProperty.call(message, "message")) {
                    let error = $root.iris.v1.SyncMessage.verify(message.message, long + 1);
                    if (error)
                        return "message." + error;
                }
                if (message.senderNickname != null && Object.hasOwnProperty.call(message, "senderNickname"))
                    if (!$util.isString(message.senderNickname))
                        return "senderNickname: string expected";
                if (message.senderAvatar != null && Object.hasOwnProperty.call(message, "senderAvatar"))
                    if (!$util.isString(message.senderAvatar))
                        return "senderAvatar: string expected";
                return null;
            };

            /**
             * Creates a MessagePush message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.MessagePush
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.MessagePush} MessagePush
             */
            MessagePush.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.MessagePush)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.MessagePush: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.MessagePush();
                if (object.message != null) {
                    if (!$util.isObject(object.message))
                        throw TypeError(".iris.v1.MessagePush.message: object expected");
                    message.message = $root.iris.v1.SyncMessage.fromObject(object.message, long + 1);
                }
                if (object.senderNickname != null)
                    message.senderNickname = String(object.senderNickname);
                if (object.senderAvatar != null)
                    message.senderAvatar = String(object.senderAvatar);
                return message;
            };

            /**
             * Creates a plain object from a MessagePush message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.MessagePush
             * @static
             * @param {iris.v1.MessagePush} message MessagePush
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MessagePush.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    object.message = null;
                    object.senderNickname = "";
                    object.senderAvatar = "";
                }
                if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                    object.message = $root.iris.v1.SyncMessage.toObject(message.message, options, q + 1);
                if (message.senderNickname != null && Object.hasOwnProperty.call(message, "senderNickname"))
                    object.senderNickname = message.senderNickname;
                if (message.senderAvatar != null && Object.hasOwnProperty.call(message, "senderAvatar"))
                    object.senderAvatar = message.senderAvatar;
                return object;
            };

            /**
             * Converts this MessagePush to JSON.
             * @function toJSON
             * @memberof iris.v1.MessagePush
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MessagePush.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for MessagePush
             * @function getTypeUrl
             * @memberof iris.v1.MessagePush
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            MessagePush.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.MessagePush";
            };

            return MessagePush;
        })();

        v1.PresenceChangeNotice = (function() {

            /**
             * Properties of a PresenceChangeNotice.
             * @memberof iris.v1
             * @interface IPresenceChangeNotice
             * @property {number|Long|null} [userId] PresenceChangeNotice userId
             * @property {boolean|null} [online] PresenceChangeNotice online
             */

            /**
             * Constructs a new PresenceChangeNotice.
             * @memberof iris.v1
             * @classdesc Represents a PresenceChangeNotice.
             * @implements IPresenceChangeNotice
             * @constructor
             * @param {iris.v1.IPresenceChangeNotice=} [properties] Properties to set
             */
            function PresenceChangeNotice(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PresenceChangeNotice userId.
             * @member {number|Long} userId
             * @memberof iris.v1.PresenceChangeNotice
             * @instance
             */
            PresenceChangeNotice.prototype.userId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * PresenceChangeNotice online.
             * @member {boolean} online
             * @memberof iris.v1.PresenceChangeNotice
             * @instance
             */
            PresenceChangeNotice.prototype.online = false;

            /**
             * Creates a new PresenceChangeNotice instance using the specified properties.
             * @function create
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {iris.v1.IPresenceChangeNotice=} [properties] Properties to set
             * @returns {iris.v1.PresenceChangeNotice} PresenceChangeNotice instance
             */
            PresenceChangeNotice.create = function create(properties) {
                return new PresenceChangeNotice(properties);
            };

            /**
             * Encodes the specified PresenceChangeNotice message. Does not implicitly {@link iris.v1.PresenceChangeNotice.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {iris.v1.IPresenceChangeNotice} message PresenceChangeNotice message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PresenceChangeNotice.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.userId);
                if (message.online != null && Object.hasOwnProperty.call(message, "online"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.online);
                return writer;
            };

            /**
             * Encodes the specified PresenceChangeNotice message, length delimited. Does not implicitly {@link iris.v1.PresenceChangeNotice.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {iris.v1.IPresenceChangeNotice} message PresenceChangeNotice message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PresenceChangeNotice.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a PresenceChangeNotice message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.PresenceChangeNotice} PresenceChangeNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PresenceChangeNotice.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.PresenceChangeNotice();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.userId = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.online = reader.bool();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a PresenceChangeNotice message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.PresenceChangeNotice} PresenceChangeNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PresenceChangeNotice.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PresenceChangeNotice message.
             * @function verify
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PresenceChangeNotice.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                    if (!$util.isInteger(message.userId) && !(message.userId && $util.isInteger(message.userId.low) && $util.isInteger(message.userId.high)))
                        return "userId: integer|Long expected";
                if (message.online != null && Object.hasOwnProperty.call(message, "online"))
                    if (typeof message.online !== "boolean")
                        return "online: boolean expected";
                return null;
            };

            /**
             * Creates a PresenceChangeNotice message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.PresenceChangeNotice} PresenceChangeNotice
             */
            PresenceChangeNotice.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.PresenceChangeNotice)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.PresenceChangeNotice: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.PresenceChangeNotice();
                if (object.userId != null)
                    if ($util.Long)
                        message.userId = $util.Long.fromValue(object.userId, true);
                    else if (typeof object.userId === "string")
                        message.userId = parseInt(object.userId, 10);
                    else if (typeof object.userId === "number")
                        message.userId = object.userId;
                    else if (typeof object.userId === "object")
                        message.userId = new $util.LongBits(object.userId.low >>> 0, object.userId.high >>> 0).toNumber(true);
                if (object.online != null)
                    message.online = Boolean(object.online);
                return message;
            };

            /**
             * Creates a plain object from a PresenceChangeNotice message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {iris.v1.PresenceChangeNotice} message PresenceChangeNotice
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PresenceChangeNotice.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.userId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.userId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.online = false;
                }
                if (message.userId != null && Object.hasOwnProperty.call(message, "userId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.userId = typeof message.userId === "number" ? BigInt(message.userId) : $util.Long.fromBits(message.userId.low >>> 0, message.userId.high >>> 0, true).toBigInt();
                    else if (typeof message.userId === "number")
                        object.userId = options.longs === String ? String(message.userId) : message.userId;
                    else
                        object.userId = options.longs === String ? $util.Long.prototype.toString.call(message.userId) : options.longs === Number ? new $util.LongBits(message.userId.low >>> 0, message.userId.high >>> 0).toNumber(true) : message.userId;
                if (message.online != null && Object.hasOwnProperty.call(message, "online"))
                    object.online = message.online;
                return object;
            };

            /**
             * Converts this PresenceChangeNotice to JSON.
             * @function toJSON
             * @memberof iris.v1.PresenceChangeNotice
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PresenceChangeNotice.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PresenceChangeNotice
             * @function getTypeUrl
             * @memberof iris.v1.PresenceChangeNotice
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PresenceChangeNotice.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.PresenceChangeNotice";
            };

            return PresenceChangeNotice;
        })();

        v1.GroupEventNotice = (function() {

            /**
             * Properties of a GroupEventNotice.
             * @memberof iris.v1
             * @interface IGroupEventNotice
             * @property {number|Long|null} [groupId] GroupEventNotice groupId
             * @property {string|null} [eventType] GroupEventNotice eventType
             * @property {string|null} [dataJson] GroupEventNotice dataJson
             */

            /**
             * Constructs a new GroupEventNotice.
             * @memberof iris.v1
             * @classdesc Represents a GroupEventNotice.
             * @implements IGroupEventNotice
             * @constructor
             * @param {iris.v1.IGroupEventNotice=} [properties] Properties to set
             */
            function GroupEventNotice(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * GroupEventNotice groupId.
             * @member {number|Long} groupId
             * @memberof iris.v1.GroupEventNotice
             * @instance
             */
            GroupEventNotice.prototype.groupId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * GroupEventNotice eventType.
             * @member {string} eventType
             * @memberof iris.v1.GroupEventNotice
             * @instance
             */
            GroupEventNotice.prototype.eventType = "";

            /**
             * GroupEventNotice dataJson.
             * @member {string} dataJson
             * @memberof iris.v1.GroupEventNotice
             * @instance
             */
            GroupEventNotice.prototype.dataJson = "";

            /**
             * Creates a new GroupEventNotice instance using the specified properties.
             * @function create
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {iris.v1.IGroupEventNotice=} [properties] Properties to set
             * @returns {iris.v1.GroupEventNotice} GroupEventNotice instance
             */
            GroupEventNotice.create = function create(properties) {
                return new GroupEventNotice(properties);
            };

            /**
             * Encodes the specified GroupEventNotice message. Does not implicitly {@link iris.v1.GroupEventNotice.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {iris.v1.IGroupEventNotice} message GroupEventNotice message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GroupEventNotice.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.groupId);
                if (message.eventType != null && Object.hasOwnProperty.call(message, "eventType"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.eventType);
                if (message.dataJson != null && Object.hasOwnProperty.call(message, "dataJson"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.dataJson);
                return writer;
            };

            /**
             * Encodes the specified GroupEventNotice message, length delimited. Does not implicitly {@link iris.v1.GroupEventNotice.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {iris.v1.IGroupEventNotice} message GroupEventNotice message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            GroupEventNotice.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a GroupEventNotice message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.GroupEventNotice} GroupEventNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GroupEventNotice.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.GroupEventNotice();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.groupId = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.eventType = reader.string();
                            break;
                        }
                    case 3: {
                            message.dataJson = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a GroupEventNotice message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.GroupEventNotice} GroupEventNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            GroupEventNotice.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a GroupEventNotice message.
             * @function verify
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            GroupEventNotice.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
                    if (!$util.isInteger(message.groupId) && !(message.groupId && $util.isInteger(message.groupId.low) && $util.isInteger(message.groupId.high)))
                        return "groupId: integer|Long expected";
                if (message.eventType != null && Object.hasOwnProperty.call(message, "eventType"))
                    if (!$util.isString(message.eventType))
                        return "eventType: string expected";
                if (message.dataJson != null && Object.hasOwnProperty.call(message, "dataJson"))
                    if (!$util.isString(message.dataJson))
                        return "dataJson: string expected";
                return null;
            };

            /**
             * Creates a GroupEventNotice message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.GroupEventNotice} GroupEventNotice
             */
            GroupEventNotice.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.GroupEventNotice)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.GroupEventNotice: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.GroupEventNotice();
                if (object.groupId != null)
                    if ($util.Long)
                        message.groupId = $util.Long.fromValue(object.groupId, true);
                    else if (typeof object.groupId === "string")
                        message.groupId = parseInt(object.groupId, 10);
                    else if (typeof object.groupId === "number")
                        message.groupId = object.groupId;
                    else if (typeof object.groupId === "object")
                        message.groupId = new $util.LongBits(object.groupId.low >>> 0, object.groupId.high >>> 0).toNumber(true);
                if (object.eventType != null)
                    message.eventType = String(object.eventType);
                if (object.dataJson != null)
                    message.dataJson = String(object.dataJson);
                return message;
            };

            /**
             * Creates a plain object from a GroupEventNotice message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {iris.v1.GroupEventNotice} message GroupEventNotice
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            GroupEventNotice.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.groupId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.groupId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.eventType = "";
                    object.dataJson = "";
                }
                if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.groupId = typeof message.groupId === "number" ? BigInt(message.groupId) : $util.Long.fromBits(message.groupId.low >>> 0, message.groupId.high >>> 0, true).toBigInt();
                    else if (typeof message.groupId === "number")
                        object.groupId = options.longs === String ? String(message.groupId) : message.groupId;
                    else
                        object.groupId = options.longs === String ? $util.Long.prototype.toString.call(message.groupId) : options.longs === Number ? new $util.LongBits(message.groupId.low >>> 0, message.groupId.high >>> 0).toNumber(true) : message.groupId;
                if (message.eventType != null && Object.hasOwnProperty.call(message, "eventType"))
                    object.eventType = message.eventType;
                if (message.dataJson != null && Object.hasOwnProperty.call(message, "dataJson"))
                    object.dataJson = message.dataJson;
                return object;
            };

            /**
             * Converts this GroupEventNotice to JSON.
             * @function toJSON
             * @memberof iris.v1.GroupEventNotice
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            GroupEventNotice.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for GroupEventNotice
             * @function getTypeUrl
             * @memberof iris.v1.GroupEventNotice
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            GroupEventNotice.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.GroupEventNotice";
            };

            return GroupEventNotice;
        })();

        v1.GatewayLink = (function() {

            /**
             * Constructs a new GatewayLink service.
             * @memberof iris.v1
             * @classdesc Represents a GatewayLink
             * @extends $protobuf.rpc.Service
             * @constructor
             * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
             * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
             * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
             */
            function GatewayLink(rpcImpl, requestDelimited, responseDelimited) {
                $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
            }

            (GatewayLink.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = GatewayLink;

            /**
             * Creates new GatewayLink service using the specified rpc implementation.
             * @function create
             * @memberof iris.v1.GatewayLink
             * @static
             * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
             * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
             * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
             * @returns {GatewayLink} RPC service. Useful where requests and/or responses are streamed.
             */
            GatewayLink.create = function create(rpcImpl, requestDelimited, responseDelimited) {
                return new this(rpcImpl, requestDelimited, responseDelimited);
            };

            /**
             * Callback as used by {@link iris.v1.GatewayLink#open}.
             * @memberof iris.v1.GatewayLink
             * @typedef OpenCallback
             * @type {function}
             * @param {Error|null} error Error, if any
             * @param {iris.v1.Downstream} [response] Downstream
             */

            /**
             * Calls Open.
             * @function open
             * @memberof iris.v1.GatewayLink
             * @instance
             * @param {iris.v1.IUpstream} request Upstream message or plain object
             * @param {iris.v1.GatewayLink.OpenCallback} callback Node-style callback called with the error, if any, and Downstream
             * @returns {undefined}
             * @variation 1
             */
            Object.defineProperty(GatewayLink.prototype.open = function open(request, callback) {
                return $protobuf.rpc.Service.prototype.rpcCall.call(this, open, $root.iris.v1.Upstream, $root.iris.v1.Downstream, request, callback);
            }, "name", { value: "Open" });

            /**
             * Calls Open.
             * @function open
             * @memberof iris.v1.GatewayLink
             * @instance
             * @param {iris.v1.IUpstream} request Upstream message or plain object
             * @returns {Promise<iris.v1.Downstream>} Promise
             * @variation 2
             */

            return GatewayLink;
        })();

        v1.NodeHello = (function() {

            /**
             * Properties of a NodeHello.
             * @memberof iris.v1
             * @interface INodeHello
             * @property {string|null} [nodeId] NodeHello nodeId
             */

            /**
             * Constructs a new NodeHello.
             * @memberof iris.v1
             * @classdesc Represents a NodeHello.
             * @implements INodeHello
             * @constructor
             * @param {iris.v1.INodeHello=} [properties] Properties to set
             */
            function NodeHello(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * NodeHello nodeId.
             * @member {string} nodeId
             * @memberof iris.v1.NodeHello
             * @instance
             */
            NodeHello.prototype.nodeId = "";

            /**
             * Creates a new NodeHello instance using the specified properties.
             * @function create
             * @memberof iris.v1.NodeHello
             * @static
             * @param {iris.v1.INodeHello=} [properties] Properties to set
             * @returns {iris.v1.NodeHello} NodeHello instance
             */
            NodeHello.create = function create(properties) {
                return new NodeHello(properties);
            };

            /**
             * Encodes the specified NodeHello message. Does not implicitly {@link iris.v1.NodeHello.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.NodeHello
             * @static
             * @param {iris.v1.INodeHello} message NodeHello message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            NodeHello.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.nodeId != null && Object.hasOwnProperty.call(message, "nodeId"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.nodeId);
                return writer;
            };

            /**
             * Encodes the specified NodeHello message, length delimited. Does not implicitly {@link iris.v1.NodeHello.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.NodeHello
             * @static
             * @param {iris.v1.INodeHello} message NodeHello message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            NodeHello.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a NodeHello message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.NodeHello
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.NodeHello} NodeHello
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            NodeHello.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.NodeHello();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.nodeId = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a NodeHello message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.NodeHello
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.NodeHello} NodeHello
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            NodeHello.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a NodeHello message.
             * @function verify
             * @memberof iris.v1.NodeHello
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            NodeHello.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.nodeId != null && Object.hasOwnProperty.call(message, "nodeId"))
                    if (!$util.isString(message.nodeId))
                        return "nodeId: string expected";
                return null;
            };

            /**
             * Creates a NodeHello message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.NodeHello
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.NodeHello} NodeHello
             */
            NodeHello.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.NodeHello)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.NodeHello: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.NodeHello();
                if (object.nodeId != null)
                    message.nodeId = String(object.nodeId);
                return message;
            };

            /**
             * Creates a plain object from a NodeHello message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.NodeHello
             * @static
             * @param {iris.v1.NodeHello} message NodeHello
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            NodeHello.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults)
                    object.nodeId = "";
                if (message.nodeId != null && Object.hasOwnProperty.call(message, "nodeId"))
                    object.nodeId = message.nodeId;
                return object;
            };

            /**
             * Converts this NodeHello to JSON.
             * @function toJSON
             * @memberof iris.v1.NodeHello
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            NodeHello.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for NodeHello
             * @function getTypeUrl
             * @memberof iris.v1.NodeHello
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            NodeHello.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.NodeHello";
            };

            return NodeHello;
        })();

        v1.ClientMsg = (function() {

            /**
             * Properties of a ClientMsg.
             * @memberof iris.v1
             * @interface IClientMsg
             * @property {number|Long|null} [uid] ClientMsg uid
             * @property {number|Long|null} [connId] ClientMsg connId
             * @property {iris.v1.IFrame|null} [frame] ClientMsg frame
             */

            /**
             * Constructs a new ClientMsg.
             * @memberof iris.v1
             * @classdesc Represents a ClientMsg.
             * @implements IClientMsg
             * @constructor
             * @param {iris.v1.IClientMsg=} [properties] Properties to set
             */
            function ClientMsg(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ClientMsg uid.
             * @member {number|Long} uid
             * @memberof iris.v1.ClientMsg
             * @instance
             */
            ClientMsg.prototype.uid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ClientMsg connId.
             * @member {number|Long} connId
             * @memberof iris.v1.ClientMsg
             * @instance
             */
            ClientMsg.prototype.connId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ClientMsg frame.
             * @member {iris.v1.IFrame|null|undefined} frame
             * @memberof iris.v1.ClientMsg
             * @instance
             */
            ClientMsg.prototype.frame = null;

            /**
             * Creates a new ClientMsg instance using the specified properties.
             * @function create
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {iris.v1.IClientMsg=} [properties] Properties to set
             * @returns {iris.v1.ClientMsg} ClientMsg instance
             */
            ClientMsg.create = function create(properties) {
                return new ClientMsg(properties);
            };

            /**
             * Encodes the specified ClientMsg message. Does not implicitly {@link iris.v1.ClientMsg.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {iris.v1.IClientMsg} message ClientMsg message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ClientMsg.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.uid);
                if (message.connId != null && Object.hasOwnProperty.call(message, "connId"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.connId);
                if (message.frame != null && Object.hasOwnProperty.call(message, "frame"))
                    $root.iris.v1.Frame.encode(message.frame, writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
                return writer;
            };

            /**
             * Encodes the specified ClientMsg message, length delimited. Does not implicitly {@link iris.v1.ClientMsg.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {iris.v1.IClientMsg} message ClientMsg message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ClientMsg.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a ClientMsg message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.ClientMsg} ClientMsg
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ClientMsg.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.ClientMsg();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.uid = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.connId = reader.uint64();
                            break;
                        }
                    case 3: {
                            message.frame = $root.iris.v1.Frame.decode(reader, reader.uint32(), undefined, long + 1);
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a ClientMsg message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.ClientMsg} ClientMsg
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ClientMsg.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ClientMsg message.
             * @function verify
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ClientMsg.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    if (!$util.isInteger(message.uid) && !(message.uid && $util.isInteger(message.uid.low) && $util.isInteger(message.uid.high)))
                        return "uid: integer|Long expected";
                if (message.connId != null && Object.hasOwnProperty.call(message, "connId"))
                    if (!$util.isInteger(message.connId) && !(message.connId && $util.isInteger(message.connId.low) && $util.isInteger(message.connId.high)))
                        return "connId: integer|Long expected";
                if (message.frame != null && Object.hasOwnProperty.call(message, "frame")) {
                    let error = $root.iris.v1.Frame.verify(message.frame, long + 1);
                    if (error)
                        return "frame." + error;
                }
                return null;
            };

            /**
             * Creates a ClientMsg message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.ClientMsg} ClientMsg
             */
            ClientMsg.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.ClientMsg)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.ClientMsg: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.ClientMsg();
                if (object.uid != null)
                    if ($util.Long)
                        message.uid = $util.Long.fromValue(object.uid, true);
                    else if (typeof object.uid === "string")
                        message.uid = parseInt(object.uid, 10);
                    else if (typeof object.uid === "number")
                        message.uid = object.uid;
                    else if (typeof object.uid === "object")
                        message.uid = new $util.LongBits(object.uid.low >>> 0, object.uid.high >>> 0).toNumber(true);
                if (object.connId != null)
                    if ($util.Long)
                        message.connId = $util.Long.fromValue(object.connId, true);
                    else if (typeof object.connId === "string")
                        message.connId = parseInt(object.connId, 10);
                    else if (typeof object.connId === "number")
                        message.connId = object.connId;
                    else if (typeof object.connId === "object")
                        message.connId = new $util.LongBits(object.connId.low >>> 0, object.connId.high >>> 0).toNumber(true);
                if (object.frame != null) {
                    if (!$util.isObject(object.frame))
                        throw TypeError(".iris.v1.ClientMsg.frame: object expected");
                    message.frame = $root.iris.v1.Frame.fromObject(object.frame, long + 1);
                }
                return message;
            };

            /**
             * Creates a plain object from a ClientMsg message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {iris.v1.ClientMsg} message ClientMsg
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ClientMsg.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.uid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.uid = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.connId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.connId = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.frame = null;
                }
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.uid = typeof message.uid === "number" ? BigInt(message.uid) : $util.Long.fromBits(message.uid.low >>> 0, message.uid.high >>> 0, true).toBigInt();
                    else if (typeof message.uid === "number")
                        object.uid = options.longs === String ? String(message.uid) : message.uid;
                    else
                        object.uid = options.longs === String ? $util.Long.prototype.toString.call(message.uid) : options.longs === Number ? new $util.LongBits(message.uid.low >>> 0, message.uid.high >>> 0).toNumber(true) : message.uid;
                if (message.connId != null && Object.hasOwnProperty.call(message, "connId"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.connId = typeof message.connId === "number" ? BigInt(message.connId) : $util.Long.fromBits(message.connId.low >>> 0, message.connId.high >>> 0, true).toBigInt();
                    else if (typeof message.connId === "number")
                        object.connId = options.longs === String ? String(message.connId) : message.connId;
                    else
                        object.connId = options.longs === String ? $util.Long.prototype.toString.call(message.connId) : options.longs === Number ? new $util.LongBits(message.connId.low >>> 0, message.connId.high >>> 0).toNumber(true) : message.connId;
                if (message.frame != null && Object.hasOwnProperty.call(message, "frame"))
                    object.frame = $root.iris.v1.Frame.toObject(message.frame, options, q + 1);
                return object;
            };

            /**
             * Converts this ClientMsg to JSON.
             * @function toJSON
             * @memberof iris.v1.ClientMsg
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ClientMsg.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ClientMsg
             * @function getTypeUrl
             * @memberof iris.v1.ClientMsg
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ClientMsg.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.ClientMsg";
            };

            return ClientMsg;
        })();

        v1.PresenceEvent = (function() {

            /**
             * Properties of a PresenceEvent.
             * @memberof iris.v1
             * @interface IPresenceEvent
             * @property {number|Long|null} [uid] PresenceEvent uid
             * @property {boolean|null} [online] PresenceEvent online
             */

            /**
             * Constructs a new PresenceEvent.
             * @memberof iris.v1
             * @classdesc Represents a PresenceEvent.
             * @implements IPresenceEvent
             * @constructor
             * @param {iris.v1.IPresenceEvent=} [properties] Properties to set
             */
            function PresenceEvent(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PresenceEvent uid.
             * @member {number|Long} uid
             * @memberof iris.v1.PresenceEvent
             * @instance
             */
            PresenceEvent.prototype.uid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * PresenceEvent online.
             * @member {boolean} online
             * @memberof iris.v1.PresenceEvent
             * @instance
             */
            PresenceEvent.prototype.online = false;

            /**
             * Creates a new PresenceEvent instance using the specified properties.
             * @function create
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {iris.v1.IPresenceEvent=} [properties] Properties to set
             * @returns {iris.v1.PresenceEvent} PresenceEvent instance
             */
            PresenceEvent.create = function create(properties) {
                return new PresenceEvent(properties);
            };

            /**
             * Encodes the specified PresenceEvent message. Does not implicitly {@link iris.v1.PresenceEvent.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {iris.v1.IPresenceEvent} message PresenceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PresenceEvent.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.uid);
                if (message.online != null && Object.hasOwnProperty.call(message, "online"))
                    writer.uint32(/* id 2, wireType 0 =*/16).bool(message.online);
                return writer;
            };

            /**
             * Encodes the specified PresenceEvent message, length delimited. Does not implicitly {@link iris.v1.PresenceEvent.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {iris.v1.IPresenceEvent} message PresenceEvent message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PresenceEvent.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a PresenceEvent message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.PresenceEvent} PresenceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PresenceEvent.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.PresenceEvent();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.uid = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.online = reader.bool();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a PresenceEvent message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.PresenceEvent} PresenceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PresenceEvent.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PresenceEvent message.
             * @function verify
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PresenceEvent.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    if (!$util.isInteger(message.uid) && !(message.uid && $util.isInteger(message.uid.low) && $util.isInteger(message.uid.high)))
                        return "uid: integer|Long expected";
                if (message.online != null && Object.hasOwnProperty.call(message, "online"))
                    if (typeof message.online !== "boolean")
                        return "online: boolean expected";
                return null;
            };

            /**
             * Creates a PresenceEvent message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.PresenceEvent} PresenceEvent
             */
            PresenceEvent.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.PresenceEvent)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.PresenceEvent: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.PresenceEvent();
                if (object.uid != null)
                    if ($util.Long)
                        message.uid = $util.Long.fromValue(object.uid, true);
                    else if (typeof object.uid === "string")
                        message.uid = parseInt(object.uid, 10);
                    else if (typeof object.uid === "number")
                        message.uid = object.uid;
                    else if (typeof object.uid === "object")
                        message.uid = new $util.LongBits(object.uid.low >>> 0, object.uid.high >>> 0).toNumber(true);
                if (object.online != null)
                    message.online = Boolean(object.online);
                return message;
            };

            /**
             * Creates a plain object from a PresenceEvent message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {iris.v1.PresenceEvent} message PresenceEvent
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PresenceEvent.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.uid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.uid = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.online = false;
                }
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.uid = typeof message.uid === "number" ? BigInt(message.uid) : $util.Long.fromBits(message.uid.low >>> 0, message.uid.high >>> 0, true).toBigInt();
                    else if (typeof message.uid === "number")
                        object.uid = options.longs === String ? String(message.uid) : message.uid;
                    else
                        object.uid = options.longs === String ? $util.Long.prototype.toString.call(message.uid) : options.longs === Number ? new $util.LongBits(message.uid.low >>> 0, message.uid.high >>> 0).toNumber(true) : message.uid;
                if (message.online != null && Object.hasOwnProperty.call(message, "online"))
                    object.online = message.online;
                return object;
            };

            /**
             * Converts this PresenceEvent to JSON.
             * @function toJSON
             * @memberof iris.v1.PresenceEvent
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PresenceEvent.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for PresenceEvent
             * @function getTypeUrl
             * @memberof iris.v1.PresenceEvent
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            PresenceEvent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.PresenceEvent";
            };

            return PresenceEvent;
        })();

        v1.Upstream = (function() {

            /**
             * Properties of an Upstream.
             * @memberof iris.v1
             * @interface IUpstream
             * @property {iris.v1.INodeHello|null} [nodeHello] Upstream nodeHello
             * @property {iris.v1.IClientMsg|null} [clientMsg] Upstream clientMsg
             * @property {iris.v1.IPresenceEvent|null} [presenceEvent] Upstream presenceEvent
             */

            /**
             * Constructs a new Upstream.
             * @memberof iris.v1
             * @classdesc Represents an Upstream.
             * @implements IUpstream
             * @constructor
             * @param {iris.v1.IUpstream=} [properties] Properties to set
             */
            function Upstream(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Upstream nodeHello.
             * @member {iris.v1.INodeHello|null|undefined} nodeHello
             * @memberof iris.v1.Upstream
             * @instance
             */
            Upstream.prototype.nodeHello = null;

            /**
             * Upstream clientMsg.
             * @member {iris.v1.IClientMsg|null|undefined} clientMsg
             * @memberof iris.v1.Upstream
             * @instance
             */
            Upstream.prototype.clientMsg = null;

            /**
             * Upstream presenceEvent.
             * @member {iris.v1.IPresenceEvent|null|undefined} presenceEvent
             * @memberof iris.v1.Upstream
             * @instance
             */
            Upstream.prototype.presenceEvent = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * Upstream body.
             * @member {"nodeHello"|"clientMsg"|"presenceEvent"|undefined} body
             * @memberof iris.v1.Upstream
             * @instance
             */
            Object.defineProperty(Upstream.prototype, "body", {
                get: $util.oneOfGetter($oneOfFields = ["nodeHello", "clientMsg", "presenceEvent"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new Upstream instance using the specified properties.
             * @function create
             * @memberof iris.v1.Upstream
             * @static
             * @param {iris.v1.IUpstream=} [properties] Properties to set
             * @returns {iris.v1.Upstream} Upstream instance
             */
            Upstream.create = function create(properties) {
                return new Upstream(properties);
            };

            /**
             * Encodes the specified Upstream message. Does not implicitly {@link iris.v1.Upstream.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.Upstream
             * @static
             * @param {iris.v1.IUpstream} message Upstream message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Upstream.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.nodeHello != null && Object.hasOwnProperty.call(message, "nodeHello"))
                    $root.iris.v1.NodeHello.encode(message.nodeHello, writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
                if (message.clientMsg != null && Object.hasOwnProperty.call(message, "clientMsg"))
                    $root.iris.v1.ClientMsg.encode(message.clientMsg, writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
                if (message.presenceEvent != null && Object.hasOwnProperty.call(message, "presenceEvent"))
                    $root.iris.v1.PresenceEvent.encode(message.presenceEvent, writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Upstream message, length delimited. Does not implicitly {@link iris.v1.Upstream.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.Upstream
             * @static
             * @param {iris.v1.IUpstream} message Upstream message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Upstream.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes an Upstream message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.Upstream
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.Upstream} Upstream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Upstream.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.Upstream();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.nodeHello = $root.iris.v1.NodeHello.decode(reader, reader.uint32(), undefined, long + 1);
                            break;
                        }
                    case 2: {
                            message.clientMsg = $root.iris.v1.ClientMsg.decode(reader, reader.uint32(), undefined, long + 1);
                            break;
                        }
                    case 3: {
                            message.presenceEvent = $root.iris.v1.PresenceEvent.decode(reader, reader.uint32(), undefined, long + 1);
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes an Upstream message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.Upstream
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.Upstream} Upstream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Upstream.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Upstream message.
             * @function verify
             * @memberof iris.v1.Upstream
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Upstream.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                let properties = {};
                if (message.nodeHello != null && Object.hasOwnProperty.call(message, "nodeHello")) {
                    properties.body = 1;
                    {
                        let error = $root.iris.v1.NodeHello.verify(message.nodeHello, long + 1);
                        if (error)
                            return "nodeHello." + error;
                    }
                }
                if (message.clientMsg != null && Object.hasOwnProperty.call(message, "clientMsg")) {
                    if (properties.body === 1)
                        return "body: multiple values";
                    properties.body = 1;
                    {
                        let error = $root.iris.v1.ClientMsg.verify(message.clientMsg, long + 1);
                        if (error)
                            return "clientMsg." + error;
                    }
                }
                if (message.presenceEvent != null && Object.hasOwnProperty.call(message, "presenceEvent")) {
                    if (properties.body === 1)
                        return "body: multiple values";
                    properties.body = 1;
                    {
                        let error = $root.iris.v1.PresenceEvent.verify(message.presenceEvent, long + 1);
                        if (error)
                            return "presenceEvent." + error;
                    }
                }
                return null;
            };

            /**
             * Creates an Upstream message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.Upstream
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.Upstream} Upstream
             */
            Upstream.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.Upstream)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.Upstream: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.Upstream();
                if (object.nodeHello != null) {
                    if (!$util.isObject(object.nodeHello))
                        throw TypeError(".iris.v1.Upstream.nodeHello: object expected");
                    message.nodeHello = $root.iris.v1.NodeHello.fromObject(object.nodeHello, long + 1);
                }
                if (object.clientMsg != null) {
                    if (!$util.isObject(object.clientMsg))
                        throw TypeError(".iris.v1.Upstream.clientMsg: object expected");
                    message.clientMsg = $root.iris.v1.ClientMsg.fromObject(object.clientMsg, long + 1);
                }
                if (object.presenceEvent != null) {
                    if (!$util.isObject(object.presenceEvent))
                        throw TypeError(".iris.v1.Upstream.presenceEvent: object expected");
                    message.presenceEvent = $root.iris.v1.PresenceEvent.fromObject(object.presenceEvent, long + 1);
                }
                return message;
            };

            /**
             * Creates a plain object from an Upstream message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.Upstream
             * @static
             * @param {iris.v1.Upstream} message Upstream
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Upstream.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (message.nodeHello != null && Object.hasOwnProperty.call(message, "nodeHello")) {
                    object.nodeHello = $root.iris.v1.NodeHello.toObject(message.nodeHello, options, q + 1);
                    if (options.oneofs)
                        object.body = "nodeHello";
                }
                if (message.clientMsg != null && Object.hasOwnProperty.call(message, "clientMsg")) {
                    object.clientMsg = $root.iris.v1.ClientMsg.toObject(message.clientMsg, options, q + 1);
                    if (options.oneofs)
                        object.body = "clientMsg";
                }
                if (message.presenceEvent != null && Object.hasOwnProperty.call(message, "presenceEvent")) {
                    object.presenceEvent = $root.iris.v1.PresenceEvent.toObject(message.presenceEvent, options, q + 1);
                    if (options.oneofs)
                        object.body = "presenceEvent";
                }
                return object;
            };

            /**
             * Converts this Upstream to JSON.
             * @function toJSON
             * @memberof iris.v1.Upstream
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Upstream.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Upstream
             * @function getTypeUrl
             * @memberof iris.v1.Upstream
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Upstream.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.Upstream";
            };

            return Upstream;
        })();

        v1.Push = (function() {

            /**
             * Properties of a Push.
             * @memberof iris.v1
             * @interface IPush
             * @property {Array.<number|Long>|null} [uids] Push uids
             * @property {iris.v1.IFrame|null} [frame] Push frame
             */

            /**
             * Constructs a new Push.
             * @memberof iris.v1
             * @classdesc Represents a Push.
             * @implements IPush
             * @constructor
             * @param {iris.v1.IPush=} [properties] Properties to set
             */
            function Push(properties) {
                this.uids = [];
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Push uids.
             * @member {Array.<number|Long>} uids
             * @memberof iris.v1.Push
             * @instance
             */
            Push.prototype.uids = $util.emptyArray;

            /**
             * Push frame.
             * @member {iris.v1.IFrame|null|undefined} frame
             * @memberof iris.v1.Push
             * @instance
             */
            Push.prototype.frame = null;

            /**
             * Creates a new Push instance using the specified properties.
             * @function create
             * @memberof iris.v1.Push
             * @static
             * @param {iris.v1.IPush=} [properties] Properties to set
             * @returns {iris.v1.Push} Push instance
             */
            Push.create = function create(properties) {
                return new Push(properties);
            };

            /**
             * Encodes the specified Push message. Does not implicitly {@link iris.v1.Push.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.Push
             * @static
             * @param {iris.v1.IPush} message Push message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Push.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.uids != null && message.uids.length) {
                    writer.uint32(/* id 1, wireType 2 =*/10).fork();
                    for (let i = 0; i < message.uids.length; ++i)
                        writer.uint64(message.uids[i]);
                    writer.ldelim();
                }
                if (message.frame != null && Object.hasOwnProperty.call(message, "frame"))
                    $root.iris.v1.Frame.encode(message.frame, writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Push message, length delimited. Does not implicitly {@link iris.v1.Push.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.Push
             * @static
             * @param {iris.v1.IPush} message Push message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Push.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a Push message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.Push
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.Push} Push
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Push.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.Push();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            if (!(message.uids && message.uids.length))
                                message.uids = [];
                            if ((tag & 7) === 2) {
                                let end2 = reader.uint32() + reader.pos;
                                if (end2 > reader.len)
                                    throw RangeError("index out of range");
                                reader.len = end2;
                                while (reader.pos < end2)
                                    message.uids.push(reader.uint64());
                                if (reader.pos !== end2)
                                    throw RangeError("index out of range");
                                reader.len = end;
                            } else
                                message.uids.push(reader.uint64());
                            break;
                        }
                    case 2: {
                            message.frame = $root.iris.v1.Frame.decode(reader, reader.uint32(), undefined, long + 1);
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a Push message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.Push
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.Push} Push
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Push.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Push message.
             * @function verify
             * @memberof iris.v1.Push
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Push.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.uids != null && Object.hasOwnProperty.call(message, "uids")) {
                    if (!Array.isArray(message.uids))
                        return "uids: array expected";
                    for (let i = 0; i < message.uids.length; ++i)
                        if (!$util.isInteger(message.uids[i]) && !(message.uids[i] && $util.isInteger(message.uids[i].low) && $util.isInteger(message.uids[i].high)))
                            return "uids: integer|Long[] expected";
                }
                if (message.frame != null && Object.hasOwnProperty.call(message, "frame")) {
                    let error = $root.iris.v1.Frame.verify(message.frame, long + 1);
                    if (error)
                        return "frame." + error;
                }
                return null;
            };

            /**
             * Creates a Push message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.Push
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.Push} Push
             */
            Push.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.Push)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.Push: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.Push();
                if (object.uids) {
                    if (!Array.isArray(object.uids))
                        throw TypeError(".iris.v1.Push.uids: array expected");
                    message.uids = [];
                    for (let i = 0; i < object.uids.length; ++i)
                        if ($util.Long)
                            message.uids[i] = $util.Long.fromValue(object.uids[i], true);
                        else if (typeof object.uids[i] === "string")
                            message.uids[i] = parseInt(object.uids[i], 10);
                        else if (typeof object.uids[i] === "number")
                            message.uids[i] = object.uids[i];
                        else if (typeof object.uids[i] === "object")
                            message.uids[i] = new $util.LongBits(object.uids[i].low >>> 0, object.uids[i].high >>> 0).toNumber(true);
                }
                if (object.frame != null) {
                    if (!$util.isObject(object.frame))
                        throw TypeError(".iris.v1.Push.frame: object expected");
                    message.frame = $root.iris.v1.Frame.fromObject(object.frame, long + 1);
                }
                return message;
            };

            /**
             * Creates a plain object from a Push message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.Push
             * @static
             * @param {iris.v1.Push} message Push
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Push.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.arrays || options.defaults)
                    object.uids = [];
                if (options.defaults)
                    object.frame = null;
                if (message.uids && message.uids.length) {
                    object.uids = [];
                    for (let j = 0; j < message.uids.length; ++j)
                        if (typeof BigInt !== "undefined" && options.longs === BigInt)
                            object.uids[j] = typeof message.uids[j] === "number" ? BigInt(message.uids[j]) : $util.Long.fromBits(message.uids[j].low >>> 0, message.uids[j].high >>> 0, true).toBigInt();
                        else if (typeof message.uids[j] === "number")
                            object.uids[j] = options.longs === String ? String(message.uids[j]) : message.uids[j];
                        else
                            object.uids[j] = options.longs === String ? $util.Long.prototype.toString.call(message.uids[j]) : options.longs === Number ? new $util.LongBits(message.uids[j].low >>> 0, message.uids[j].high >>> 0).toNumber(true) : message.uids[j];
                }
                if (message.frame != null && Object.hasOwnProperty.call(message, "frame"))
                    object.frame = $root.iris.v1.Frame.toObject(message.frame, options, q + 1);
                return object;
            };

            /**
             * Converts this Push to JSON.
             * @function toJSON
             * @memberof iris.v1.Push
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Push.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Push
             * @function getTypeUrl
             * @memberof iris.v1.Push
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Push.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.Push";
            };

            return Push;
        })();

        v1.ForceKick = (function() {

            /**
             * Properties of a ForceKick.
             * @memberof iris.v1
             * @interface IForceKick
             * @property {number|Long|null} [uid] ForceKick uid
             * @property {string|null} [reason] ForceKick reason
             */

            /**
             * Constructs a new ForceKick.
             * @memberof iris.v1
             * @classdesc Represents a ForceKick.
             * @implements IForceKick
             * @constructor
             * @param {iris.v1.IForceKick=} [properties] Properties to set
             */
            function ForceKick(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * ForceKick uid.
             * @member {number|Long} uid
             * @memberof iris.v1.ForceKick
             * @instance
             */
            ForceKick.prototype.uid = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

            /**
             * ForceKick reason.
             * @member {string} reason
             * @memberof iris.v1.ForceKick
             * @instance
             */
            ForceKick.prototype.reason = "";

            /**
             * Creates a new ForceKick instance using the specified properties.
             * @function create
             * @memberof iris.v1.ForceKick
             * @static
             * @param {iris.v1.IForceKick=} [properties] Properties to set
             * @returns {iris.v1.ForceKick} ForceKick instance
             */
            ForceKick.create = function create(properties) {
                return new ForceKick(properties);
            };

            /**
             * Encodes the specified ForceKick message. Does not implicitly {@link iris.v1.ForceKick.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.ForceKick
             * @static
             * @param {iris.v1.IForceKick} message ForceKick message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ForceKick.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.uid);
                if (message.reason != null && Object.hasOwnProperty.call(message, "reason"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.reason);
                return writer;
            };

            /**
             * Encodes the specified ForceKick message, length delimited. Does not implicitly {@link iris.v1.ForceKick.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.ForceKick
             * @static
             * @param {iris.v1.IForceKick} message ForceKick message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            ForceKick.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a ForceKick message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.ForceKick
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.ForceKick} ForceKick
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ForceKick.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.ForceKick();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.uid = reader.uint64();
                            break;
                        }
                    case 2: {
                            message.reason = reader.string();
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a ForceKick message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.ForceKick
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.ForceKick} ForceKick
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            ForceKick.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a ForceKick message.
             * @function verify
             * @memberof iris.v1.ForceKick
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            ForceKick.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    if (!$util.isInteger(message.uid) && !(message.uid && $util.isInteger(message.uid.low) && $util.isInteger(message.uid.high)))
                        return "uid: integer|Long expected";
                if (message.reason != null && Object.hasOwnProperty.call(message, "reason"))
                    if (!$util.isString(message.reason))
                        return "reason: string expected";
                return null;
            };

            /**
             * Creates a ForceKick message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.ForceKick
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.ForceKick} ForceKick
             */
            ForceKick.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.ForceKick)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.ForceKick: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.ForceKick();
                if (object.uid != null)
                    if ($util.Long)
                        message.uid = $util.Long.fromValue(object.uid, true);
                    else if (typeof object.uid === "string")
                        message.uid = parseInt(object.uid, 10);
                    else if (typeof object.uid === "number")
                        message.uid = object.uid;
                    else if (typeof object.uid === "object")
                        message.uid = new $util.LongBits(object.uid.low >>> 0, object.uid.high >>> 0).toNumber(true);
                if (object.reason != null)
                    message.reason = String(object.reason);
                return message;
            };

            /**
             * Creates a plain object from a ForceKick message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.ForceKick
             * @static
             * @param {iris.v1.ForceKick} message ForceKick
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            ForceKick.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (options.defaults) {
                    if ($util.Long) {
                        let long = new $util.Long(0, 0, true);
                        object.uid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                    } else
                        object.uid = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                    object.reason = "";
                }
                if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
                    if (typeof BigInt !== "undefined" && options.longs === BigInt)
                        object.uid = typeof message.uid === "number" ? BigInt(message.uid) : $util.Long.fromBits(message.uid.low >>> 0, message.uid.high >>> 0, true).toBigInt();
                    else if (typeof message.uid === "number")
                        object.uid = options.longs === String ? String(message.uid) : message.uid;
                    else
                        object.uid = options.longs === String ? $util.Long.prototype.toString.call(message.uid) : options.longs === Number ? new $util.LongBits(message.uid.low >>> 0, message.uid.high >>> 0).toNumber(true) : message.uid;
                if (message.reason != null && Object.hasOwnProperty.call(message, "reason"))
                    object.reason = message.reason;
                return object;
            };

            /**
             * Converts this ForceKick to JSON.
             * @function toJSON
             * @memberof iris.v1.ForceKick
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            ForceKick.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for ForceKick
             * @function getTypeUrl
             * @memberof iris.v1.ForceKick
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            ForceKick.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.ForceKick";
            };

            return ForceKick;
        })();

        v1.Downstream = (function() {

            /**
             * Properties of a Downstream.
             * @memberof iris.v1
             * @interface IDownstream
             * @property {iris.v1.IPush|null} [push] Downstream push
             * @property {iris.v1.IForceKick|null} [forceKick] Downstream forceKick
             */

            /**
             * Constructs a new Downstream.
             * @memberof iris.v1
             * @classdesc Represents a Downstream.
             * @implements IDownstream
             * @constructor
             * @param {iris.v1.IDownstream=} [properties] Properties to set
             */
            function Downstream(properties) {
                if (properties)
                    for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null && keys[i] !== "__proto__")
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Downstream push.
             * @member {iris.v1.IPush|null|undefined} push
             * @memberof iris.v1.Downstream
             * @instance
             */
            Downstream.prototype.push = null;

            /**
             * Downstream forceKick.
             * @member {iris.v1.IForceKick|null|undefined} forceKick
             * @memberof iris.v1.Downstream
             * @instance
             */
            Downstream.prototype.forceKick = null;

            // OneOf field names bound to virtual getters and setters
            let $oneOfFields;

            /**
             * Downstream body.
             * @member {"push"|"forceKick"|undefined} body
             * @memberof iris.v1.Downstream
             * @instance
             */
            Object.defineProperty(Downstream.prototype, "body", {
                get: $util.oneOfGetter($oneOfFields = ["push", "forceKick"]),
                set: $util.oneOfSetter($oneOfFields)
            });

            /**
             * Creates a new Downstream instance using the specified properties.
             * @function create
             * @memberof iris.v1.Downstream
             * @static
             * @param {iris.v1.IDownstream=} [properties] Properties to set
             * @returns {iris.v1.Downstream} Downstream instance
             */
            Downstream.create = function create(properties) {
                return new Downstream(properties);
            };

            /**
             * Encodes the specified Downstream message. Does not implicitly {@link iris.v1.Downstream.verify|verify} messages.
             * @function encode
             * @memberof iris.v1.Downstream
             * @static
             * @param {iris.v1.IDownstream} message Downstream message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Downstream.encode = function encode(message, writer, q) {
                if (!writer)
                    writer = $Writer.create();
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                if (message.push != null && Object.hasOwnProperty.call(message, "push"))
                    $root.iris.v1.Push.encode(message.push, writer.uint32(/* id 1, wireType 2 =*/10).fork(), q + 1).ldelim();
                if (message.forceKick != null && Object.hasOwnProperty.call(message, "forceKick"))
                    $root.iris.v1.ForceKick.encode(message.forceKick, writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
                return writer;
            };

            /**
             * Encodes the specified Downstream message, length delimited. Does not implicitly {@link iris.v1.Downstream.verify|verify} messages.
             * @function encodeDelimited
             * @memberof iris.v1.Downstream
             * @static
             * @param {iris.v1.IDownstream} message Downstream message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Downstream.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
            };

            /**
             * Decodes a Downstream message from the specified reader or buffer.
             * @function decode
             * @memberof iris.v1.Downstream
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {iris.v1.Downstream} Downstream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Downstream.decode = function decode(reader, length, error, long) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                if (long === undefined)
                    long = 0;
                if (long > $Reader.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let end, message;
                if (length === undefined)
                    end = reader.len;
                else {
                    end = reader.pos + length;
                    if (end > reader.len)
                        throw RangeError("index out of range");
                    length = reader.len;
                    reader.len = end;
                }
                message = new $root.iris.v1.Downstream();
                while (reader.pos < end) {
                    let tag = reader.uint32();
                    if (tag === error)
                        break;
                    switch (tag >>> 3) {
                    case 1: {
                            message.push = $root.iris.v1.Push.decode(reader, reader.uint32(), undefined, long + 1);
                            break;
                        }
                    case 2: {
                            message.forceKick = $root.iris.v1.ForceKick.decode(reader, reader.uint32(), undefined, long + 1);
                            break;
                        }
                    default:
                        reader.skipType(tag & 7, long);
                        break;
                    }
                }
                if (length !== undefined) {
                    if (reader.pos !== end)
                        throw RangeError("index out of range");
                    reader.len = length;
                }
                return message;
            };

            /**
             * Decodes a Downstream message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof iris.v1.Downstream
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {iris.v1.Downstream} Downstream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Downstream.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a Downstream message.
             * @function verify
             * @memberof iris.v1.Downstream
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            Downstream.verify = function verify(message, long) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    return "maximum nesting depth exceeded";
                let properties = {};
                if (message.push != null && Object.hasOwnProperty.call(message, "push")) {
                    properties.body = 1;
                    {
                        let error = $root.iris.v1.Push.verify(message.push, long + 1);
                        if (error)
                            return "push." + error;
                    }
                }
                if (message.forceKick != null && Object.hasOwnProperty.call(message, "forceKick")) {
                    if (properties.body === 1)
                        return "body: multiple values";
                    properties.body = 1;
                    {
                        let error = $root.iris.v1.ForceKick.verify(message.forceKick, long + 1);
                        if (error)
                            return "forceKick." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a Downstream message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof iris.v1.Downstream
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {iris.v1.Downstream} Downstream
             */
            Downstream.fromObject = function fromObject(object, long) {
                if (object instanceof $root.iris.v1.Downstream)
                    return object;
                if (!$util.isObject(object))
                    throw TypeError(".iris.v1.Downstream: object expected");
                if (long === undefined)
                    long = 0;
                if (long > $util.recursionLimit)
                    throw Error("maximum nesting depth exceeded");
                let message = new $root.iris.v1.Downstream();
                if (object.push != null) {
                    if (!$util.isObject(object.push))
                        throw TypeError(".iris.v1.Downstream.push: object expected");
                    message.push = $root.iris.v1.Push.fromObject(object.push, long + 1);
                }
                if (object.forceKick != null) {
                    if (!$util.isObject(object.forceKick))
                        throw TypeError(".iris.v1.Downstream.forceKick: object expected");
                    message.forceKick = $root.iris.v1.ForceKick.fromObject(object.forceKick, long + 1);
                }
                return message;
            };

            /**
             * Creates a plain object from a Downstream message. Also converts values to other types if specified.
             * @function toObject
             * @memberof iris.v1.Downstream
             * @static
             * @param {iris.v1.Downstream} message Downstream
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Downstream.toObject = function toObject(message, options, q) {
                if (!options)
                    options = {};
                if (q === undefined)
                    q = 0;
                if (q > $util.recursionLimit)
                    throw Error("max depth exceeded");
                let object = {};
                if (message.push != null && Object.hasOwnProperty.call(message, "push")) {
                    object.push = $root.iris.v1.Push.toObject(message.push, options, q + 1);
                    if (options.oneofs)
                        object.body = "push";
                }
                if (message.forceKick != null && Object.hasOwnProperty.call(message, "forceKick")) {
                    object.forceKick = $root.iris.v1.ForceKick.toObject(message.forceKick, options, q + 1);
                    if (options.oneofs)
                        object.body = "forceKick";
                }
                return object;
            };

            /**
             * Converts this Downstream to JSON.
             * @function toJSON
             * @memberof iris.v1.Downstream
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            Downstream.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            /**
             * Gets the default type url for Downstream
             * @function getTypeUrl
             * @memberof iris.v1.Downstream
             * @static
             * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns {string} The default type url
             */
            Downstream.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
                if (typeUrlPrefix === undefined) {
                    typeUrlPrefix = "type.googleapis.com";
                }
                return typeUrlPrefix + "/iris.v1.Downstream";
            };

            return Downstream;
        })();

        return v1;
    })();

    return iris;
})();

export { $root as default };
