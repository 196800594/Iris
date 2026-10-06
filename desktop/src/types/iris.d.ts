import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace iris. */
export namespace iris {

    /** Namespace v1. */
    namespace v1 {

        /** FrameType enum. */
        enum FrameType {
            FRAME_TYPE_UNSPECIFIED = 0,
            REQUEST = 1,
            RESPONSE = 2,
            NOTICE = 3
        }

        /** MsgType enum. */
        enum MsgType {
            MSG_TYPE_UNSPECIFIED = 0,
            TEXT = 1,
            IMAGE = 2,
            FILE = 3,
            SYSTEM = 4
        }

        /** Properties of a Frame. */
        interface IFrame {

            /** Frame id */
            id?: (number|Long|null);

            /** Frame frameType */
            frameType?: (iris.v1.FrameType|null);

            /** Frame method */
            method?: (string|null);

            /** Frame payload */
            payload?: (Uint8Array|null);

            /** Frame code */
            code?: (number|null);

            /** Frame msg */
            msg?: (string|null);
        }

        /** Represents a Frame. */
        class Frame implements IFrame {

            /**
             * Constructs a new Frame.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IFrame);

            /** Frame id. */
            public id: (number|Long);

            /** Frame frameType. */
            public frameType: iris.v1.FrameType;

            /** Frame method. */
            public method: string;

            /** Frame payload. */
            public payload: Uint8Array;

            /** Frame code. */
            public code: number;

            /** Frame msg. */
            public msg: string;

            /**
             * Creates a new Frame instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Frame instance
             */
            public static create(properties?: iris.v1.IFrame): iris.v1.Frame;

            /**
             * Encodes the specified Frame message. Does not implicitly {@link iris.v1.Frame.verify|verify} messages.
             * @param message Frame message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IFrame, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Frame message, length delimited. Does not implicitly {@link iris.v1.Frame.verify|verify} messages.
             * @param message Frame message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IFrame, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Frame message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Frame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.Frame;

            /**
             * Decodes a Frame message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Frame
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.Frame;

            /**
             * Verifies a Frame message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Frame message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Frame
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.Frame;

            /**
             * Creates a plain object from a Frame message. Also converts values to other types if specified.
             * @param message Frame
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.Frame, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Frame to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Frame
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MessageSendReq. */
        interface IMessageSendReq {

            /** MessageSendReq clientMsgId */
            clientMsgId?: (string|null);

            /** MessageSendReq convId */
            convId?: (number|Long|null);

            /** MessageSendReq msgType */
            msgType?: (iris.v1.MsgType|null);

            /** MessageSendReq content */
            content?: (string|null);

            /** MessageSendReq toUid */
            toUid?: (number|Long|null);
        }

        /** Represents a MessageSendReq. */
        class MessageSendReq implements IMessageSendReq {

            /**
             * Constructs a new MessageSendReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IMessageSendReq);

            /** MessageSendReq clientMsgId. */
            public clientMsgId: string;

            /** MessageSendReq convId. */
            public convId: (number|Long);

            /** MessageSendReq msgType. */
            public msgType: iris.v1.MsgType;

            /** MessageSendReq content. */
            public content: string;

            /** MessageSendReq toUid. */
            public toUid: (number|Long);

            /**
             * Creates a new MessageSendReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MessageSendReq instance
             */
            public static create(properties?: iris.v1.IMessageSendReq): iris.v1.MessageSendReq;

            /**
             * Encodes the specified MessageSendReq message. Does not implicitly {@link iris.v1.MessageSendReq.verify|verify} messages.
             * @param message MessageSendReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IMessageSendReq, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MessageSendReq message, length delimited. Does not implicitly {@link iris.v1.MessageSendReq.verify|verify} messages.
             * @param message MessageSendReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IMessageSendReq, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MessageSendReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MessageSendReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.MessageSendReq;

            /**
             * Decodes a MessageSendReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MessageSendReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.MessageSendReq;

            /**
             * Verifies a MessageSendReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MessageSendReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MessageSendReq
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.MessageSendReq;

            /**
             * Creates a plain object from a MessageSendReq message. Also converts values to other types if specified.
             * @param message MessageSendReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.MessageSendReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MessageSendReq to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MessageSendReq
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MessageAckNotice. */
        interface IMessageAckNotice {

            /** MessageAckNotice clientMsgId */
            clientMsgId?: (string|null);

            /** MessageAckNotice serverMsgId */
            serverMsgId?: (number|Long|null);

            /** MessageAckNotice convId */
            convId?: (number|Long|null);

            /** MessageAckNotice seq */
            seq?: (number|Long|null);

            /** MessageAckNotice createTimeMs */
            createTimeMs?: (number|Long|null);
        }

        /** Represents a MessageAckNotice. */
        class MessageAckNotice implements IMessageAckNotice {

            /**
             * Constructs a new MessageAckNotice.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IMessageAckNotice);

            /** MessageAckNotice clientMsgId. */
            public clientMsgId: string;

            /** MessageAckNotice serverMsgId. */
            public serverMsgId: (number|Long);

            /** MessageAckNotice convId. */
            public convId: (number|Long);

            /** MessageAckNotice seq. */
            public seq: (number|Long);

            /** MessageAckNotice createTimeMs. */
            public createTimeMs: (number|Long);

            /**
             * Creates a new MessageAckNotice instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MessageAckNotice instance
             */
            public static create(properties?: iris.v1.IMessageAckNotice): iris.v1.MessageAckNotice;

            /**
             * Encodes the specified MessageAckNotice message. Does not implicitly {@link iris.v1.MessageAckNotice.verify|verify} messages.
             * @param message MessageAckNotice message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IMessageAckNotice, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MessageAckNotice message, length delimited. Does not implicitly {@link iris.v1.MessageAckNotice.verify|verify} messages.
             * @param message MessageAckNotice message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IMessageAckNotice, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MessageAckNotice message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MessageAckNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.MessageAckNotice;

            /**
             * Decodes a MessageAckNotice message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MessageAckNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.MessageAckNotice;

            /**
             * Verifies a MessageAckNotice message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MessageAckNotice message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MessageAckNotice
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.MessageAckNotice;

            /**
             * Creates a plain object from a MessageAckNotice message. Also converts values to other types if specified.
             * @param message MessageAckNotice
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.MessageAckNotice, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MessageAckNotice to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MessageAckNotice
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ConvSyncReq. */
        interface IConvSyncReq {

            /** ConvSyncReq cursors */
            cursors?: (iris.v1.IConvCursor[]|null);

            /** ConvSyncReq batchSize */
            batchSize?: (number|null);
        }

        /** Represents a ConvSyncReq. */
        class ConvSyncReq implements IConvSyncReq {

            /**
             * Constructs a new ConvSyncReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IConvSyncReq);

            /** ConvSyncReq cursors. */
            public cursors: iris.v1.IConvCursor[];

            /** ConvSyncReq batchSize. */
            public batchSize: number;

            /**
             * Creates a new ConvSyncReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConvSyncReq instance
             */
            public static create(properties?: iris.v1.IConvSyncReq): iris.v1.ConvSyncReq;

            /**
             * Encodes the specified ConvSyncReq message. Does not implicitly {@link iris.v1.ConvSyncReq.verify|verify} messages.
             * @param message ConvSyncReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IConvSyncReq, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConvSyncReq message, length delimited. Does not implicitly {@link iris.v1.ConvSyncReq.verify|verify} messages.
             * @param message ConvSyncReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IConvSyncReq, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConvSyncReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConvSyncReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.ConvSyncReq;

            /**
             * Decodes a ConvSyncReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConvSyncReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.ConvSyncReq;

            /**
             * Verifies a ConvSyncReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConvSyncReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConvSyncReq
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.ConvSyncReq;

            /**
             * Creates a plain object from a ConvSyncReq message. Also converts values to other types if specified.
             * @param message ConvSyncReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.ConvSyncReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConvSyncReq to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ConvSyncReq
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ConvCursor. */
        interface IConvCursor {

            /** ConvCursor convId */
            convId?: (number|Long|null);

            /** ConvCursor hasSeq */
            hasSeq?: (number|Long|null);
        }

        /** Represents a ConvCursor. */
        class ConvCursor implements IConvCursor {

            /**
             * Constructs a new ConvCursor.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IConvCursor);

            /** ConvCursor convId. */
            public convId: (number|Long);

            /** ConvCursor hasSeq. */
            public hasSeq: (number|Long);

            /**
             * Creates a new ConvCursor instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConvCursor instance
             */
            public static create(properties?: iris.v1.IConvCursor): iris.v1.ConvCursor;

            /**
             * Encodes the specified ConvCursor message. Does not implicitly {@link iris.v1.ConvCursor.verify|verify} messages.
             * @param message ConvCursor message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IConvCursor, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConvCursor message, length delimited. Does not implicitly {@link iris.v1.ConvCursor.verify|verify} messages.
             * @param message ConvCursor message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IConvCursor, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConvCursor message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConvCursor
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.ConvCursor;

            /**
             * Decodes a ConvCursor message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConvCursor
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.ConvCursor;

            /**
             * Verifies a ConvCursor message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConvCursor message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConvCursor
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.ConvCursor;

            /**
             * Creates a plain object from a ConvCursor message. Also converts values to other types if specified.
             * @param message ConvCursor
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.ConvCursor, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConvCursor to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ConvCursor
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SyncMessage. */
        interface ISyncMessage {

            /** SyncMessage id */
            id?: (number|Long|null);

            /** SyncMessage convId */
            convId?: (number|Long|null);

            /** SyncMessage senderId */
            senderId?: (number|Long|null);

            /** SyncMessage msgType */
            msgType?: (iris.v1.MsgType|null);

            /** SyncMessage content */
            content?: (string|null);

            /** SyncMessage seq */
            seq?: (number|Long|null);

            /** SyncMessage clientMsgId */
            clientMsgId?: (string|null);

            /** SyncMessage createTimeMs */
            createTimeMs?: (number|Long|null);
        }

        /** Represents a SyncMessage. */
        class SyncMessage implements ISyncMessage {

            /**
             * Constructs a new SyncMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.ISyncMessage);

            /** SyncMessage id. */
            public id: (number|Long);

            /** SyncMessage convId. */
            public convId: (number|Long);

            /** SyncMessage senderId. */
            public senderId: (number|Long);

            /** SyncMessage msgType. */
            public msgType: iris.v1.MsgType;

            /** SyncMessage content. */
            public content: string;

            /** SyncMessage seq. */
            public seq: (number|Long);

            /** SyncMessage clientMsgId. */
            public clientMsgId: string;

            /** SyncMessage createTimeMs. */
            public createTimeMs: (number|Long);

            /**
             * Creates a new SyncMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SyncMessage instance
             */
            public static create(properties?: iris.v1.ISyncMessage): iris.v1.SyncMessage;

            /**
             * Encodes the specified SyncMessage message. Does not implicitly {@link iris.v1.SyncMessage.verify|verify} messages.
             * @param message SyncMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.ISyncMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SyncMessage message, length delimited. Does not implicitly {@link iris.v1.SyncMessage.verify|verify} messages.
             * @param message SyncMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.ISyncMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SyncMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SyncMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.SyncMessage;

            /**
             * Decodes a SyncMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SyncMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.SyncMessage;

            /**
             * Verifies a SyncMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SyncMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SyncMessage
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.SyncMessage;

            /**
             * Creates a plain object from a SyncMessage message. Also converts values to other types if specified.
             * @param message SyncMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.SyncMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SyncMessage to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for SyncMessage
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ConvSyncResp. */
        interface IConvSyncResp {

            /** ConvSyncResp convId */
            convId?: (number|Long|null);

            /** ConvSyncResp messages */
            messages?: (iris.v1.ISyncMessage[]|null);

            /** ConvSyncResp hasMore */
            hasMore?: (boolean|null);
        }

        /** Represents a ConvSyncResp. */
        class ConvSyncResp implements IConvSyncResp {

            /**
             * Constructs a new ConvSyncResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IConvSyncResp);

            /** ConvSyncResp convId. */
            public convId: (number|Long);

            /** ConvSyncResp messages. */
            public messages: iris.v1.ISyncMessage[];

            /** ConvSyncResp hasMore. */
            public hasMore: boolean;

            /**
             * Creates a new ConvSyncResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConvSyncResp instance
             */
            public static create(properties?: iris.v1.IConvSyncResp): iris.v1.ConvSyncResp;

            /**
             * Encodes the specified ConvSyncResp message. Does not implicitly {@link iris.v1.ConvSyncResp.verify|verify} messages.
             * @param message ConvSyncResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IConvSyncResp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConvSyncResp message, length delimited. Does not implicitly {@link iris.v1.ConvSyncResp.verify|verify} messages.
             * @param message ConvSyncResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IConvSyncResp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConvSyncResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConvSyncResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.ConvSyncResp;

            /**
             * Decodes a ConvSyncResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConvSyncResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.ConvSyncResp;

            /**
             * Verifies a ConvSyncResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConvSyncResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConvSyncResp
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.ConvSyncResp;

            /**
             * Creates a plain object from a ConvSyncResp message. Also converts values to other types if specified.
             * @param message ConvSyncResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.ConvSyncResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConvSyncResp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ConvSyncResp
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ConvSyncBatchResp. */
        interface IConvSyncBatchResp {

            /** ConvSyncBatchResp convs */
            convs?: (iris.v1.IConvSyncResp[]|null);
        }

        /** Represents a ConvSyncBatchResp. */
        class ConvSyncBatchResp implements IConvSyncBatchResp {

            /**
             * Constructs a new ConvSyncBatchResp.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IConvSyncBatchResp);

            /** ConvSyncBatchResp convs. */
            public convs: iris.v1.IConvSyncResp[];

            /**
             * Creates a new ConvSyncBatchResp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConvSyncBatchResp instance
             */
            public static create(properties?: iris.v1.IConvSyncBatchResp): iris.v1.ConvSyncBatchResp;

            /**
             * Encodes the specified ConvSyncBatchResp message. Does not implicitly {@link iris.v1.ConvSyncBatchResp.verify|verify} messages.
             * @param message ConvSyncBatchResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IConvSyncBatchResp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConvSyncBatchResp message, length delimited. Does not implicitly {@link iris.v1.ConvSyncBatchResp.verify|verify} messages.
             * @param message ConvSyncBatchResp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IConvSyncBatchResp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConvSyncBatchResp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConvSyncBatchResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.ConvSyncBatchResp;

            /**
             * Decodes a ConvSyncBatchResp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConvSyncBatchResp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.ConvSyncBatchResp;

            /**
             * Verifies a ConvSyncBatchResp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConvSyncBatchResp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConvSyncBatchResp
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.ConvSyncBatchResp;

            /**
             * Creates a plain object from a ConvSyncBatchResp message. Also converts values to other types if specified.
             * @param message ConvSyncBatchResp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.ConvSyncBatchResp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConvSyncBatchResp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ConvSyncBatchResp
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ConvReadReq. */
        interface IConvReadReq {

            /** ConvReadReq convId */
            convId?: (number|Long|null);

            /** ConvReadReq readSeq */
            readSeq?: (number|Long|null);
        }

        /** Represents a ConvReadReq. */
        class ConvReadReq implements IConvReadReq {

            /**
             * Constructs a new ConvReadReq.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IConvReadReq);

            /** ConvReadReq convId. */
            public convId: (number|Long);

            /** ConvReadReq readSeq. */
            public readSeq: (number|Long);

            /**
             * Creates a new ConvReadReq instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConvReadReq instance
             */
            public static create(properties?: iris.v1.IConvReadReq): iris.v1.ConvReadReq;

            /**
             * Encodes the specified ConvReadReq message. Does not implicitly {@link iris.v1.ConvReadReq.verify|verify} messages.
             * @param message ConvReadReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IConvReadReq, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConvReadReq message, length delimited. Does not implicitly {@link iris.v1.ConvReadReq.verify|verify} messages.
             * @param message ConvReadReq message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IConvReadReq, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConvReadReq message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConvReadReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.ConvReadReq;

            /**
             * Decodes a ConvReadReq message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConvReadReq
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.ConvReadReq;

            /**
             * Verifies a ConvReadReq message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConvReadReq message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConvReadReq
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.ConvReadReq;

            /**
             * Creates a plain object from a ConvReadReq message. Also converts values to other types if specified.
             * @param message ConvReadReq
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.ConvReadReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConvReadReq to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ConvReadReq
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ConvReadNotice. */
        interface IConvReadNotice {

            /** ConvReadNotice convId */
            convId?: (number|Long|null);

            /** ConvReadNotice userId */
            userId?: (number|Long|null);

            /** ConvReadNotice readSeq */
            readSeq?: (number|Long|null);
        }

        /** Represents a ConvReadNotice. */
        class ConvReadNotice implements IConvReadNotice {

            /**
             * Constructs a new ConvReadNotice.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IConvReadNotice);

            /** ConvReadNotice convId. */
            public convId: (number|Long);

            /** ConvReadNotice userId. */
            public userId: (number|Long);

            /** ConvReadNotice readSeq. */
            public readSeq: (number|Long);

            /**
             * Creates a new ConvReadNotice instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ConvReadNotice instance
             */
            public static create(properties?: iris.v1.IConvReadNotice): iris.v1.ConvReadNotice;

            /**
             * Encodes the specified ConvReadNotice message. Does not implicitly {@link iris.v1.ConvReadNotice.verify|verify} messages.
             * @param message ConvReadNotice message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IConvReadNotice, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ConvReadNotice message, length delimited. Does not implicitly {@link iris.v1.ConvReadNotice.verify|verify} messages.
             * @param message ConvReadNotice message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IConvReadNotice, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ConvReadNotice message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ConvReadNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.ConvReadNotice;

            /**
             * Decodes a ConvReadNotice message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ConvReadNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.ConvReadNotice;

            /**
             * Verifies a ConvReadNotice message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ConvReadNotice message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ConvReadNotice
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.ConvReadNotice;

            /**
             * Creates a plain object from a ConvReadNotice message. Also converts values to other types if specified.
             * @param message ConvReadNotice
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.ConvReadNotice, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ConvReadNotice to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ConvReadNotice
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MessagePush. */
        interface IMessagePush {

            /** MessagePush message */
            message?: (iris.v1.ISyncMessage|null);

            /** MessagePush senderNickname */
            senderNickname?: (string|null);

            /** MessagePush senderAvatar */
            senderAvatar?: (string|null);
        }

        /** Represents a MessagePush. */
        class MessagePush implements IMessagePush {

            /**
             * Constructs a new MessagePush.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IMessagePush);

            /** MessagePush message. */
            public message?: (iris.v1.ISyncMessage|null);

            /** MessagePush senderNickname. */
            public senderNickname: string;

            /** MessagePush senderAvatar. */
            public senderAvatar: string;

            /**
             * Creates a new MessagePush instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MessagePush instance
             */
            public static create(properties?: iris.v1.IMessagePush): iris.v1.MessagePush;

            /**
             * Encodes the specified MessagePush message. Does not implicitly {@link iris.v1.MessagePush.verify|verify} messages.
             * @param message MessagePush message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IMessagePush, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MessagePush message, length delimited. Does not implicitly {@link iris.v1.MessagePush.verify|verify} messages.
             * @param message MessagePush message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IMessagePush, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MessagePush message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MessagePush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.MessagePush;

            /**
             * Decodes a MessagePush message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MessagePush
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.MessagePush;

            /**
             * Verifies a MessagePush message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MessagePush message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MessagePush
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.MessagePush;

            /**
             * Creates a plain object from a MessagePush message. Also converts values to other types if specified.
             * @param message MessagePush
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.MessagePush, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MessagePush to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MessagePush
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PresenceChangeNotice. */
        interface IPresenceChangeNotice {

            /** PresenceChangeNotice userId */
            userId?: (number|Long|null);

            /** PresenceChangeNotice online */
            online?: (boolean|null);
        }

        /** Represents a PresenceChangeNotice. */
        class PresenceChangeNotice implements IPresenceChangeNotice {

            /**
             * Constructs a new PresenceChangeNotice.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IPresenceChangeNotice);

            /** PresenceChangeNotice userId. */
            public userId: (number|Long);

            /** PresenceChangeNotice online. */
            public online: boolean;

            /**
             * Creates a new PresenceChangeNotice instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PresenceChangeNotice instance
             */
            public static create(properties?: iris.v1.IPresenceChangeNotice): iris.v1.PresenceChangeNotice;

            /**
             * Encodes the specified PresenceChangeNotice message. Does not implicitly {@link iris.v1.PresenceChangeNotice.verify|verify} messages.
             * @param message PresenceChangeNotice message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IPresenceChangeNotice, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PresenceChangeNotice message, length delimited. Does not implicitly {@link iris.v1.PresenceChangeNotice.verify|verify} messages.
             * @param message PresenceChangeNotice message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IPresenceChangeNotice, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PresenceChangeNotice message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PresenceChangeNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.PresenceChangeNotice;

            /**
             * Decodes a PresenceChangeNotice message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PresenceChangeNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.PresenceChangeNotice;

            /**
             * Verifies a PresenceChangeNotice message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PresenceChangeNotice message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PresenceChangeNotice
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.PresenceChangeNotice;

            /**
             * Creates a plain object from a PresenceChangeNotice message. Also converts values to other types if specified.
             * @param message PresenceChangeNotice
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.PresenceChangeNotice, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PresenceChangeNotice to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PresenceChangeNotice
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a GroupEventNotice. */
        interface IGroupEventNotice {

            /** GroupEventNotice groupId */
            groupId?: (number|Long|null);

            /** GroupEventNotice eventType */
            eventType?: (string|null);

            /** GroupEventNotice dataJson */
            dataJson?: (string|null);
        }

        /** Represents a GroupEventNotice. */
        class GroupEventNotice implements IGroupEventNotice {

            /**
             * Constructs a new GroupEventNotice.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IGroupEventNotice);

            /** GroupEventNotice groupId. */
            public groupId: (number|Long);

            /** GroupEventNotice eventType. */
            public eventType: string;

            /** GroupEventNotice dataJson. */
            public dataJson: string;

            /**
             * Creates a new GroupEventNotice instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GroupEventNotice instance
             */
            public static create(properties?: iris.v1.IGroupEventNotice): iris.v1.GroupEventNotice;

            /**
             * Encodes the specified GroupEventNotice message. Does not implicitly {@link iris.v1.GroupEventNotice.verify|verify} messages.
             * @param message GroupEventNotice message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IGroupEventNotice, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GroupEventNotice message, length delimited. Does not implicitly {@link iris.v1.GroupEventNotice.verify|verify} messages.
             * @param message GroupEventNotice message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IGroupEventNotice, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GroupEventNotice message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GroupEventNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.GroupEventNotice;

            /**
             * Decodes a GroupEventNotice message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GroupEventNotice
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.GroupEventNotice;

            /**
             * Verifies a GroupEventNotice message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GroupEventNotice message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GroupEventNotice
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.GroupEventNotice;

            /**
             * Creates a plain object from a GroupEventNotice message. Also converts values to other types if specified.
             * @param message GroupEventNotice
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.GroupEventNotice, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GroupEventNotice to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for GroupEventNotice
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Represents a GatewayLink */
        class GatewayLink extends $protobuf.rpc.Service {

            /**
             * Constructs a new GatewayLink service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Creates new GatewayLink service using the specified rpc implementation.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             * @returns RPC service. Useful where requests and/or responses are streamed.
             */
            public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): GatewayLink;

            /**
             * Calls Open.
             * @param request Upstream message or plain object
             * @param callback Node-style callback called with the error, if any, and Downstream
             */
            public open(request: iris.v1.IUpstream, callback: iris.v1.GatewayLink.OpenCallback): void;

            /**
             * Calls Open.
             * @param request Upstream message or plain object
             * @returns Promise
             */
            public open(request: iris.v1.IUpstream): Promise<iris.v1.Downstream>;
        }

        namespace GatewayLink {

            /**
             * Callback as used by {@link iris.v1.GatewayLink#open}.
             * @param error Error, if any
             * @param [response] Downstream
             */
            type OpenCallback = (error: (Error|null), response?: iris.v1.Downstream) => void;
        }

        /** Properties of a NodeHello. */
        interface INodeHello {

            /** NodeHello nodeId */
            nodeId?: (string|null);
        }

        /** Represents a NodeHello. */
        class NodeHello implements INodeHello {

            /**
             * Constructs a new NodeHello.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.INodeHello);

            /** NodeHello nodeId. */
            public nodeId: string;

            /**
             * Creates a new NodeHello instance using the specified properties.
             * @param [properties] Properties to set
             * @returns NodeHello instance
             */
            public static create(properties?: iris.v1.INodeHello): iris.v1.NodeHello;

            /**
             * Encodes the specified NodeHello message. Does not implicitly {@link iris.v1.NodeHello.verify|verify} messages.
             * @param message NodeHello message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.INodeHello, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified NodeHello message, length delimited. Does not implicitly {@link iris.v1.NodeHello.verify|verify} messages.
             * @param message NodeHello message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.INodeHello, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a NodeHello message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns NodeHello
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.NodeHello;

            /**
             * Decodes a NodeHello message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns NodeHello
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.NodeHello;

            /**
             * Verifies a NodeHello message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a NodeHello message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns NodeHello
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.NodeHello;

            /**
             * Creates a plain object from a NodeHello message. Also converts values to other types if specified.
             * @param message NodeHello
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.NodeHello, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this NodeHello to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for NodeHello
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ClientMsg. */
        interface IClientMsg {

            /** ClientMsg uid */
            uid?: (number|Long|null);

            /** ClientMsg connId */
            connId?: (number|Long|null);

            /** ClientMsg frame */
            frame?: (iris.v1.IFrame|null);
        }

        /** Represents a ClientMsg. */
        class ClientMsg implements IClientMsg {

            /**
             * Constructs a new ClientMsg.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IClientMsg);

            /** ClientMsg uid. */
            public uid: (number|Long);

            /** ClientMsg connId. */
            public connId: (number|Long);

            /** ClientMsg frame. */
            public frame?: (iris.v1.IFrame|null);

            /**
             * Creates a new ClientMsg instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ClientMsg instance
             */
            public static create(properties?: iris.v1.IClientMsg): iris.v1.ClientMsg;

            /**
             * Encodes the specified ClientMsg message. Does not implicitly {@link iris.v1.ClientMsg.verify|verify} messages.
             * @param message ClientMsg message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IClientMsg, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ClientMsg message, length delimited. Does not implicitly {@link iris.v1.ClientMsg.verify|verify} messages.
             * @param message ClientMsg message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IClientMsg, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ClientMsg message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ClientMsg
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.ClientMsg;

            /**
             * Decodes a ClientMsg message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ClientMsg
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.ClientMsg;

            /**
             * Verifies a ClientMsg message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ClientMsg message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ClientMsg
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.ClientMsg;

            /**
             * Creates a plain object from a ClientMsg message. Also converts values to other types if specified.
             * @param message ClientMsg
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.ClientMsg, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ClientMsg to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ClientMsg
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a PresenceEvent. */
        interface IPresenceEvent {

            /** PresenceEvent uid */
            uid?: (number|Long|null);

            /** PresenceEvent online */
            online?: (boolean|null);
        }

        /** Represents a PresenceEvent. */
        class PresenceEvent implements IPresenceEvent {

            /**
             * Constructs a new PresenceEvent.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IPresenceEvent);

            /** PresenceEvent uid. */
            public uid: (number|Long);

            /** PresenceEvent online. */
            public online: boolean;

            /**
             * Creates a new PresenceEvent instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PresenceEvent instance
             */
            public static create(properties?: iris.v1.IPresenceEvent): iris.v1.PresenceEvent;

            /**
             * Encodes the specified PresenceEvent message. Does not implicitly {@link iris.v1.PresenceEvent.verify|verify} messages.
             * @param message PresenceEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IPresenceEvent, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PresenceEvent message, length delimited. Does not implicitly {@link iris.v1.PresenceEvent.verify|verify} messages.
             * @param message PresenceEvent message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IPresenceEvent, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PresenceEvent message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PresenceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.PresenceEvent;

            /**
             * Decodes a PresenceEvent message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PresenceEvent
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.PresenceEvent;

            /**
             * Verifies a PresenceEvent message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PresenceEvent message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PresenceEvent
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.PresenceEvent;

            /**
             * Creates a plain object from a PresenceEvent message. Also converts values to other types if specified.
             * @param message PresenceEvent
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.PresenceEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PresenceEvent to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PresenceEvent
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an Upstream. */
        interface IUpstream {

            /** Upstream nodeHello */
            nodeHello?: (iris.v1.INodeHello|null);

            /** Upstream clientMsg */
            clientMsg?: (iris.v1.IClientMsg|null);

            /** Upstream presenceEvent */
            presenceEvent?: (iris.v1.IPresenceEvent|null);
        }

        /** Represents an Upstream. */
        class Upstream implements IUpstream {

            /**
             * Constructs a new Upstream.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IUpstream);

            /** Upstream nodeHello. */
            public nodeHello?: (iris.v1.INodeHello|null);

            /** Upstream clientMsg. */
            public clientMsg?: (iris.v1.IClientMsg|null);

            /** Upstream presenceEvent. */
            public presenceEvent?: (iris.v1.IPresenceEvent|null);

            /** Upstream body. */
            public body?: ("nodeHello"|"clientMsg"|"presenceEvent");

            /**
             * Creates a new Upstream instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Upstream instance
             */
            public static create(properties?: iris.v1.IUpstream): iris.v1.Upstream;

            /**
             * Encodes the specified Upstream message. Does not implicitly {@link iris.v1.Upstream.verify|verify} messages.
             * @param message Upstream message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IUpstream, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Upstream message, length delimited. Does not implicitly {@link iris.v1.Upstream.verify|verify} messages.
             * @param message Upstream message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IUpstream, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Upstream message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Upstream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.Upstream;

            /**
             * Decodes an Upstream message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Upstream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.Upstream;

            /**
             * Verifies an Upstream message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Upstream message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Upstream
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.Upstream;

            /**
             * Creates a plain object from an Upstream message. Also converts values to other types if specified.
             * @param message Upstream
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.Upstream, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Upstream to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Upstream
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Push. */
        interface IPush {

            /** Push uids */
            uids?: ((number|Long)[]|null);

            /** Push frame */
            frame?: (iris.v1.IFrame|null);
        }

        /** Represents a Push. */
        class Push implements IPush {

            /**
             * Constructs a new Push.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IPush);

            /** Push uids. */
            public uids: (number|Long)[];

            /** Push frame. */
            public frame?: (iris.v1.IFrame|null);

            /**
             * Creates a new Push instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Push instance
             */
            public static create(properties?: iris.v1.IPush): iris.v1.Push;

            /**
             * Encodes the specified Push message. Does not implicitly {@link iris.v1.Push.verify|verify} messages.
             * @param message Push message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IPush, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Push message, length delimited. Does not implicitly {@link iris.v1.Push.verify|verify} messages.
             * @param message Push message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IPush, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Push message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Push
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.Push;

            /**
             * Decodes a Push message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Push
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.Push;

            /**
             * Verifies a Push message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Push message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Push
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.Push;

            /**
             * Creates a plain object from a Push message. Also converts values to other types if specified.
             * @param message Push
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.Push, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Push to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Push
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ForceKick. */
        interface IForceKick {

            /** ForceKick uid */
            uid?: (number|Long|null);

            /** ForceKick reason */
            reason?: (string|null);
        }

        /** Represents a ForceKick. */
        class ForceKick implements IForceKick {

            /**
             * Constructs a new ForceKick.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IForceKick);

            /** ForceKick uid. */
            public uid: (number|Long);

            /** ForceKick reason. */
            public reason: string;

            /**
             * Creates a new ForceKick instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ForceKick instance
             */
            public static create(properties?: iris.v1.IForceKick): iris.v1.ForceKick;

            /**
             * Encodes the specified ForceKick message. Does not implicitly {@link iris.v1.ForceKick.verify|verify} messages.
             * @param message ForceKick message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IForceKick, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ForceKick message, length delimited. Does not implicitly {@link iris.v1.ForceKick.verify|verify} messages.
             * @param message ForceKick message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IForceKick, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ForceKick message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ForceKick
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.ForceKick;

            /**
             * Decodes a ForceKick message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ForceKick
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.ForceKick;

            /**
             * Verifies a ForceKick message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ForceKick message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ForceKick
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.ForceKick;

            /**
             * Creates a plain object from a ForceKick message. Also converts values to other types if specified.
             * @param message ForceKick
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.ForceKick, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ForceKick to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ForceKick
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Downstream. */
        interface IDownstream {

            /** Downstream push */
            push?: (iris.v1.IPush|null);

            /** Downstream forceKick */
            forceKick?: (iris.v1.IForceKick|null);
        }

        /** Represents a Downstream. */
        class Downstream implements IDownstream {

            /**
             * Constructs a new Downstream.
             * @param [properties] Properties to set
             */
            constructor(properties?: iris.v1.IDownstream);

            /** Downstream push. */
            public push?: (iris.v1.IPush|null);

            /** Downstream forceKick. */
            public forceKick?: (iris.v1.IForceKick|null);

            /** Downstream body. */
            public body?: ("push"|"forceKick");

            /**
             * Creates a new Downstream instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Downstream instance
             */
            public static create(properties?: iris.v1.IDownstream): iris.v1.Downstream;

            /**
             * Encodes the specified Downstream message. Does not implicitly {@link iris.v1.Downstream.verify|verify} messages.
             * @param message Downstream message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: iris.v1.IDownstream, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Downstream message, length delimited. Does not implicitly {@link iris.v1.Downstream.verify|verify} messages.
             * @param message Downstream message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: iris.v1.IDownstream, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Downstream message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Downstream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): iris.v1.Downstream;

            /**
             * Decodes a Downstream message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Downstream
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): iris.v1.Downstream;

            /**
             * Verifies a Downstream message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Downstream message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Downstream
             */
            public static fromObject(object: { [k: string]: any }): iris.v1.Downstream;

            /**
             * Creates a plain object from a Downstream message. Also converts values to other types if specified.
             * @param message Downstream
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: iris.v1.Downstream, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Downstream to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Downstream
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
        }
    }
}
