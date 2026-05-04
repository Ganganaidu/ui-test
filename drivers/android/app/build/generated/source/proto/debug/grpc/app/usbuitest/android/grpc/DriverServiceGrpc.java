package app.usbuitest.android.grpc;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.62.2)",
    comments = "Source: usbuitest/driver.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class DriverServiceGrpc {

  private DriverServiceGrpc() {}

  public static final java.lang.String SERVICE_NAME = "usbuitest.driver.DriverService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.TapRequest,
      app.usbuitest.android.grpc.TapResponse> getTapMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Tap",
      requestType = app.usbuitest.android.grpc.TapRequest.class,
      responseType = app.usbuitest.android.grpc.TapResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.TapRequest,
      app.usbuitest.android.grpc.TapResponse> getTapMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.TapRequest, app.usbuitest.android.grpc.TapResponse> getTapMethod;
    if ((getTapMethod = DriverServiceGrpc.getTapMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getTapMethod = DriverServiceGrpc.getTapMethod) == null) {
          DriverServiceGrpc.getTapMethod = getTapMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.TapRequest, app.usbuitest.android.grpc.TapResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Tap"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.TapRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.TapResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getTapMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.TapPercentRequest,
      app.usbuitest.android.grpc.TapResponse> getTapPercentMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "TapPercent",
      requestType = app.usbuitest.android.grpc.TapPercentRequest.class,
      responseType = app.usbuitest.android.grpc.TapResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.TapPercentRequest,
      app.usbuitest.android.grpc.TapResponse> getTapPercentMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.TapPercentRequest, app.usbuitest.android.grpc.TapResponse> getTapPercentMethod;
    if ((getTapPercentMethod = DriverServiceGrpc.getTapPercentMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getTapPercentMethod = DriverServiceGrpc.getTapPercentMethod) == null) {
          DriverServiceGrpc.getTapPercentMethod = getTapPercentMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.TapPercentRequest, app.usbuitest.android.grpc.TapResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "TapPercent"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.TapPercentRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.TapResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getTapPercentMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.EnterTextRequest,
      app.usbuitest.android.grpc.ActionResponse> getEnterTextMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "EnterText",
      requestType = app.usbuitest.android.grpc.EnterTextRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.EnterTextRequest,
      app.usbuitest.android.grpc.ActionResponse> getEnterTextMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.EnterTextRequest, app.usbuitest.android.grpc.ActionResponse> getEnterTextMethod;
    if ((getEnterTextMethod = DriverServiceGrpc.getEnterTextMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getEnterTextMethod = DriverServiceGrpc.getEnterTextMethod) == null) {
          DriverServiceGrpc.getEnterTextMethod = getEnterTextMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.EnterTextRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "EnterText"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.EnterTextRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getEnterTextMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.EraseTextRequest,
      app.usbuitest.android.grpc.ActionResponse> getEraseTextMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "EraseText",
      requestType = app.usbuitest.android.grpc.EraseTextRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.EraseTextRequest,
      app.usbuitest.android.grpc.ActionResponse> getEraseTextMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.EraseTextRequest, app.usbuitest.android.grpc.ActionResponse> getEraseTextMethod;
    if ((getEraseTextMethod = DriverServiceGrpc.getEraseTextMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getEraseTextMethod = DriverServiceGrpc.getEraseTextMethod) == null) {
          DriverServiceGrpc.getEraseTextMethod = getEraseTextMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.EraseTextRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "EraseText"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.EraseTextRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getEraseTextMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.CopyTextRequest,
      app.usbuitest.android.grpc.ActionResponse> getCopyTextMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CopyText",
      requestType = app.usbuitest.android.grpc.CopyTextRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.CopyTextRequest,
      app.usbuitest.android.grpc.ActionResponse> getCopyTextMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.CopyTextRequest, app.usbuitest.android.grpc.ActionResponse> getCopyTextMethod;
    if ((getCopyTextMethod = DriverServiceGrpc.getCopyTextMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getCopyTextMethod = DriverServiceGrpc.getCopyTextMethod) == null) {
          DriverServiceGrpc.getCopyTextMethod = getCopyTextMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.CopyTextRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CopyText"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.CopyTextRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getCopyTextMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.PasteTextRequest,
      app.usbuitest.android.grpc.ActionResponse> getPasteTextMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "PasteText",
      requestType = app.usbuitest.android.grpc.PasteTextRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.PasteTextRequest,
      app.usbuitest.android.grpc.ActionResponse> getPasteTextMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.PasteTextRequest, app.usbuitest.android.grpc.ActionResponse> getPasteTextMethod;
    if ((getPasteTextMethod = DriverServiceGrpc.getPasteTextMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getPasteTextMethod = DriverServiceGrpc.getPasteTextMethod) == null) {
          DriverServiceGrpc.getPasteTextMethod = getPasteTextMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.PasteTextRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "PasteText"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.PasteTextRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getPasteTextMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.BackRequest,
      app.usbuitest.android.grpc.ActionResponse> getBackMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Back",
      requestType = app.usbuitest.android.grpc.BackRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.BackRequest,
      app.usbuitest.android.grpc.ActionResponse> getBackMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.BackRequest, app.usbuitest.android.grpc.ActionResponse> getBackMethod;
    if ((getBackMethod = DriverServiceGrpc.getBackMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getBackMethod = DriverServiceGrpc.getBackMethod) == null) {
          DriverServiceGrpc.getBackMethod = getBackMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.BackRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Back"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.BackRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getBackMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.HomeRequest,
      app.usbuitest.android.grpc.ActionResponse> getHomeMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Home",
      requestType = app.usbuitest.android.grpc.HomeRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.HomeRequest,
      app.usbuitest.android.grpc.ActionResponse> getHomeMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.HomeRequest, app.usbuitest.android.grpc.ActionResponse> getHomeMethod;
    if ((getHomeMethod = DriverServiceGrpc.getHomeMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getHomeMethod = DriverServiceGrpc.getHomeMethod) == null) {
          DriverServiceGrpc.getHomeMethod = getHomeMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.HomeRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Home"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.HomeRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getHomeMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.RotateRequest,
      app.usbuitest.android.grpc.RotateResponse> getRotateMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Rotate",
      requestType = app.usbuitest.android.grpc.RotateRequest.class,
      responseType = app.usbuitest.android.grpc.RotateResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.RotateRequest,
      app.usbuitest.android.grpc.RotateResponse> getRotateMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.RotateRequest, app.usbuitest.android.grpc.RotateResponse> getRotateMethod;
    if ((getRotateMethod = DriverServiceGrpc.getRotateMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getRotateMethod = DriverServiceGrpc.getRotateMethod) == null) {
          DriverServiceGrpc.getRotateMethod = getRotateMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.RotateRequest, app.usbuitest.android.grpc.RotateResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Rotate"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.RotateRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.RotateResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getRotateMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.HideKeyboardRequest,
      app.usbuitest.android.grpc.ActionResponse> getHideKeyboardMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "HideKeyboard",
      requestType = app.usbuitest.android.grpc.HideKeyboardRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.HideKeyboardRequest,
      app.usbuitest.android.grpc.ActionResponse> getHideKeyboardMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.HideKeyboardRequest, app.usbuitest.android.grpc.ActionResponse> getHideKeyboardMethod;
    if ((getHideKeyboardMethod = DriverServiceGrpc.getHideKeyboardMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getHideKeyboardMethod = DriverServiceGrpc.getHideKeyboardMethod) == null) {
          DriverServiceGrpc.getHideKeyboardMethod = getHideKeyboardMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.HideKeyboardRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "HideKeyboard"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.HideKeyboardRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getHideKeyboardMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.PressKeyRequest,
      app.usbuitest.android.grpc.ActionResponse> getPressKeyMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "PressKey",
      requestType = app.usbuitest.android.grpc.PressKeyRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.PressKeyRequest,
      app.usbuitest.android.grpc.ActionResponse> getPressKeyMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.PressKeyRequest, app.usbuitest.android.grpc.ActionResponse> getPressKeyMethod;
    if ((getPressKeyMethod = DriverServiceGrpc.getPressKeyMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getPressKeyMethod = DriverServiceGrpc.getPressKeyMethod) == null) {
          DriverServiceGrpc.getPressKeyMethod = getPressKeyMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.PressKeyRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "PressKey"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.PressKeyRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getPressKeyMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SwipeRequest,
      app.usbuitest.android.grpc.ActionResponse> getSwipeMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "Swipe",
      requestType = app.usbuitest.android.grpc.SwipeRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SwipeRequest,
      app.usbuitest.android.grpc.ActionResponse> getSwipeMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SwipeRequest, app.usbuitest.android.grpc.ActionResponse> getSwipeMethod;
    if ((getSwipeMethod = DriverServiceGrpc.getSwipeMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getSwipeMethod = DriverServiceGrpc.getSwipeMethod) == null) {
          DriverServiceGrpc.getSwipeMethod = getSwipeMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.SwipeRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "Swipe"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.SwipeRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getSwipeMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.LaunchAppRequest,
      app.usbuitest.android.grpc.ActionResponse> getLaunchAppMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "LaunchApp",
      requestType = app.usbuitest.android.grpc.LaunchAppRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.LaunchAppRequest,
      app.usbuitest.android.grpc.ActionResponse> getLaunchAppMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.LaunchAppRequest, app.usbuitest.android.grpc.ActionResponse> getLaunchAppMethod;
    if ((getLaunchAppMethod = DriverServiceGrpc.getLaunchAppMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getLaunchAppMethod = DriverServiceGrpc.getLaunchAppMethod) == null) {
          DriverServiceGrpc.getLaunchAppMethod = getLaunchAppMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.LaunchAppRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "LaunchApp"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.LaunchAppRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getLaunchAppMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.KillAppRequest,
      app.usbuitest.android.grpc.ActionResponse> getKillAppMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "KillApp",
      requestType = app.usbuitest.android.grpc.KillAppRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.KillAppRequest,
      app.usbuitest.android.grpc.ActionResponse> getKillAppMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.KillAppRequest, app.usbuitest.android.grpc.ActionResponse> getKillAppMethod;
    if ((getKillAppMethod = DriverServiceGrpc.getKillAppMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getKillAppMethod = DriverServiceGrpc.getKillAppMethod) == null) {
          DriverServiceGrpc.getKillAppMethod = getKillAppMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.KillAppRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "KillApp"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.KillAppRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getKillAppMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SwitchToPrimaryAppRequest,
      app.usbuitest.android.grpc.ActionResponse> getSwitchToPrimaryAppMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SwitchToPrimaryApp",
      requestType = app.usbuitest.android.grpc.SwitchToPrimaryAppRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SwitchToPrimaryAppRequest,
      app.usbuitest.android.grpc.ActionResponse> getSwitchToPrimaryAppMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SwitchToPrimaryAppRequest, app.usbuitest.android.grpc.ActionResponse> getSwitchToPrimaryAppMethod;
    if ((getSwitchToPrimaryAppMethod = DriverServiceGrpc.getSwitchToPrimaryAppMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getSwitchToPrimaryAppMethod = DriverServiceGrpc.getSwitchToPrimaryAppMethod) == null) {
          DriverServiceGrpc.getSwitchToPrimaryAppMethod = getSwitchToPrimaryAppMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.SwitchToPrimaryAppRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SwitchToPrimaryApp"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.SwitchToPrimaryAppRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getSwitchToPrimaryAppMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.CheckAppInForegroundRequest,
      app.usbuitest.android.grpc.ActionResponse> getCheckAppInForegroundMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "CheckAppInForeground",
      requestType = app.usbuitest.android.grpc.CheckAppInForegroundRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.CheckAppInForegroundRequest,
      app.usbuitest.android.grpc.ActionResponse> getCheckAppInForegroundMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.CheckAppInForegroundRequest, app.usbuitest.android.grpc.ActionResponse> getCheckAppInForegroundMethod;
    if ((getCheckAppInForegroundMethod = DriverServiceGrpc.getCheckAppInForegroundMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getCheckAppInForegroundMethod = DriverServiceGrpc.getCheckAppInForegroundMethod) == null) {
          DriverServiceGrpc.getCheckAppInForegroundMethod = getCheckAppInForegroundMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.CheckAppInForegroundRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "CheckAppInForeground"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.CheckAppInForegroundRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getCheckAppInForegroundMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetAppListRequest,
      app.usbuitest.android.grpc.AppListResponse> getGetAppListMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetAppList",
      requestType = app.usbuitest.android.grpc.GetAppListRequest.class,
      responseType = app.usbuitest.android.grpc.AppListResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetAppListRequest,
      app.usbuitest.android.grpc.AppListResponse> getGetAppListMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetAppListRequest, app.usbuitest.android.grpc.AppListResponse> getGetAppListMethod;
    if ((getGetAppListMethod = DriverServiceGrpc.getGetAppListMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getGetAppListMethod = DriverServiceGrpc.getGetAppListMethod) == null) {
          DriverServiceGrpc.getGetAppListMethod = getGetAppListMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.GetAppListRequest, app.usbuitest.android.grpc.AppListResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetAppList"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.GetAppListRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.AppListResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getGetAppListMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.UpdateAppIdsRequest,
      app.usbuitest.android.grpc.ActionResponse> getUpdateAppIdsMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "UpdateAppIds",
      requestType = app.usbuitest.android.grpc.UpdateAppIdsRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.UpdateAppIdsRequest,
      app.usbuitest.android.grpc.ActionResponse> getUpdateAppIdsMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.UpdateAppIdsRequest, app.usbuitest.android.grpc.ActionResponse> getUpdateAppIdsMethod;
    if ((getUpdateAppIdsMethod = DriverServiceGrpc.getUpdateAppIdsMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getUpdateAppIdsMethod = DriverServiceGrpc.getUpdateAppIdsMethod) == null) {
          DriverServiceGrpc.getUpdateAppIdsMethod = getUpdateAppIdsMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.UpdateAppIdsRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "UpdateAppIds"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.UpdateAppIdsRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getUpdateAppIdsMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetDeviceScaleRequest,
      app.usbuitest.android.grpc.DeviceScaleResponse> getGetDeviceScaleMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetDeviceScale",
      requestType = app.usbuitest.android.grpc.GetDeviceScaleRequest.class,
      responseType = app.usbuitest.android.grpc.DeviceScaleResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetDeviceScaleRequest,
      app.usbuitest.android.grpc.DeviceScaleResponse> getGetDeviceScaleMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetDeviceScaleRequest, app.usbuitest.android.grpc.DeviceScaleResponse> getGetDeviceScaleMethod;
    if ((getGetDeviceScaleMethod = DriverServiceGrpc.getGetDeviceScaleMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getGetDeviceScaleMethod = DriverServiceGrpc.getGetDeviceScaleMethod) == null) {
          DriverServiceGrpc.getGetDeviceScaleMethod = getGetDeviceScaleMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.GetDeviceScaleRequest, app.usbuitest.android.grpc.DeviceScaleResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetDeviceScale"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.GetDeviceScaleRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.DeviceScaleResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getGetDeviceScaleMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenDimensionRequest,
      app.usbuitest.android.grpc.ScreenDimensionResponse> getGetScreenDimensionMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetScreenDimension",
      requestType = app.usbuitest.android.grpc.GetScreenDimensionRequest.class,
      responseType = app.usbuitest.android.grpc.ScreenDimensionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenDimensionRequest,
      app.usbuitest.android.grpc.ScreenDimensionResponse> getGetScreenDimensionMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenDimensionRequest, app.usbuitest.android.grpc.ScreenDimensionResponse> getGetScreenDimensionMethod;
    if ((getGetScreenDimensionMethod = DriverServiceGrpc.getGetScreenDimensionMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getGetScreenDimensionMethod = DriverServiceGrpc.getGetScreenDimensionMethod) == null) {
          DriverServiceGrpc.getGetScreenDimensionMethod = getGetScreenDimensionMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.GetScreenDimensionRequest, app.usbuitest.android.grpc.ScreenDimensionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetScreenDimension"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.GetScreenDimensionRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ScreenDimensionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getGetScreenDimensionMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SetLocationRequest,
      app.usbuitest.android.grpc.ActionResponse> getSetLocationMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "SetLocation",
      requestType = app.usbuitest.android.grpc.SetLocationRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SetLocationRequest,
      app.usbuitest.android.grpc.ActionResponse> getSetLocationMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.SetLocationRequest, app.usbuitest.android.grpc.ActionResponse> getSetLocationMethod;
    if ((getSetLocationMethod = DriverServiceGrpc.getSetLocationMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getSetLocationMethod = DriverServiceGrpc.getSetLocationMethod) == null) {
          DriverServiceGrpc.getSetLocationMethod = getSetLocationMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.SetLocationRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "SetLocation"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.SetLocationRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getSetLocationMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenshotRequest,
      app.usbuitest.android.grpc.ScreenshotResponse> getGetScreenshotMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetScreenshot",
      requestType = app.usbuitest.android.grpc.GetScreenshotRequest.class,
      responseType = app.usbuitest.android.grpc.ScreenshotResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenshotRequest,
      app.usbuitest.android.grpc.ScreenshotResponse> getGetScreenshotMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenshotRequest, app.usbuitest.android.grpc.ScreenshotResponse> getGetScreenshotMethod;
    if ((getGetScreenshotMethod = DriverServiceGrpc.getGetScreenshotMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getGetScreenshotMethod = DriverServiceGrpc.getGetScreenshotMethod) == null) {
          DriverServiceGrpc.getGetScreenshotMethod = getGetScreenshotMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.GetScreenshotRequest, app.usbuitest.android.grpc.ScreenshotResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetScreenshot"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.GetScreenshotRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ScreenshotResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getGetScreenshotMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetHierarchyRequest,
      app.usbuitest.android.grpc.ScreenshotResponse> getGetHierarchyMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetHierarchy",
      requestType = app.usbuitest.android.grpc.GetHierarchyRequest.class,
      responseType = app.usbuitest.android.grpc.ScreenshotResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetHierarchyRequest,
      app.usbuitest.android.grpc.ScreenshotResponse> getGetHierarchyMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetHierarchyRequest, app.usbuitest.android.grpc.ScreenshotResponse> getGetHierarchyMethod;
    if ((getGetHierarchyMethod = DriverServiceGrpc.getGetHierarchyMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getGetHierarchyMethod = DriverServiceGrpc.getGetHierarchyMethod) == null) {
          DriverServiceGrpc.getGetHierarchyMethod = getGetHierarchyMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.GetHierarchyRequest, app.usbuitest.android.grpc.ScreenshotResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetHierarchy"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.GetHierarchyRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ScreenshotResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getGetHierarchyMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest,
      app.usbuitest.android.grpc.ScreenshotResponse> getGetScreenshotAndHierarchyMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetScreenshotAndHierarchy",
      requestType = app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest.class,
      responseType = app.usbuitest.android.grpc.ScreenshotResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest,
      app.usbuitest.android.grpc.ScreenshotResponse> getGetScreenshotAndHierarchyMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest, app.usbuitest.android.grpc.ScreenshotResponse> getGetScreenshotAndHierarchyMethod;
    if ((getGetScreenshotAndHierarchyMethod = DriverServiceGrpc.getGetScreenshotAndHierarchyMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getGetScreenshotAndHierarchyMethod = DriverServiceGrpc.getGetScreenshotAndHierarchyMethod) == null) {
          DriverServiceGrpc.getGetScreenshotAndHierarchyMethod = getGetScreenshotAndHierarchyMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest, app.usbuitest.android.grpc.ScreenshotResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetScreenshotAndHierarchy"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ScreenshotResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getGetScreenshotAndHierarchyMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetRawScreenshotRequest,
      app.usbuitest.android.grpc.RawScreenshotResponse> getGetRawScreenshotMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "GetRawScreenshot",
      requestType = app.usbuitest.android.grpc.GetRawScreenshotRequest.class,
      responseType = app.usbuitest.android.grpc.RawScreenshotResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetRawScreenshotRequest,
      app.usbuitest.android.grpc.RawScreenshotResponse> getGetRawScreenshotMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.GetRawScreenshotRequest, app.usbuitest.android.grpc.RawScreenshotResponse> getGetRawScreenshotMethod;
    if ((getGetRawScreenshotMethod = DriverServiceGrpc.getGetRawScreenshotMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getGetRawScreenshotMethod = DriverServiceGrpc.getGetRawScreenshotMethod) == null) {
          DriverServiceGrpc.getGetRawScreenshotMethod = getGetRawScreenshotMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.GetRawScreenshotRequest, app.usbuitest.android.grpc.RawScreenshotResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "GetRawScreenshot"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.GetRawScreenshotRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.RawScreenshotResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getGetRawScreenshotMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StartStreamingRequest,
      app.usbuitest.android.grpc.StreamFrame> getStartStreamingMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "StartStreaming",
      requestType = app.usbuitest.android.grpc.StartStreamingRequest.class,
      responseType = app.usbuitest.android.grpc.StreamFrame.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StartStreamingRequest,
      app.usbuitest.android.grpc.StreamFrame> getStartStreamingMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StartStreamingRequest, app.usbuitest.android.grpc.StreamFrame> getStartStreamingMethod;
    if ((getStartStreamingMethod = DriverServiceGrpc.getStartStreamingMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getStartStreamingMethod = DriverServiceGrpc.getStartStreamingMethod) == null) {
          DriverServiceGrpc.getStartStreamingMethod = getStartStreamingMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.StartStreamingRequest, app.usbuitest.android.grpc.StreamFrame>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "StartStreaming"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.StartStreamingRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.StreamFrame.getDefaultInstance()))
              .build();
        }
      }
    }
    return getStartStreamingMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StopStreamingRequest,
      app.usbuitest.android.grpc.ActionResponse> getStopStreamingMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "StopStreaming",
      requestType = app.usbuitest.android.grpc.StopStreamingRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StopStreamingRequest,
      app.usbuitest.android.grpc.ActionResponse> getStopStreamingMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StopStreamingRequest, app.usbuitest.android.grpc.ActionResponse> getStopStreamingMethod;
    if ((getStopStreamingMethod = DriverServiceGrpc.getStopStreamingMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getStopStreamingMethod = DriverServiceGrpc.getStopStreamingMethod) == null) {
          DriverServiceGrpc.getStopStreamingMethod = getStopStreamingMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.StopStreamingRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "StopStreaming"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.StopStreamingRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getStopStreamingMethod;
  }

  private static volatile io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StopExecutionRequest,
      app.usbuitest.android.grpc.ActionResponse> getStopExecutionMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "StopExecution",
      requestType = app.usbuitest.android.grpc.StopExecutionRequest.class,
      responseType = app.usbuitest.android.grpc.ActionResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StopExecutionRequest,
      app.usbuitest.android.grpc.ActionResponse> getStopExecutionMethod() {
    io.grpc.MethodDescriptor<app.usbuitest.android.grpc.StopExecutionRequest, app.usbuitest.android.grpc.ActionResponse> getStopExecutionMethod;
    if ((getStopExecutionMethod = DriverServiceGrpc.getStopExecutionMethod) == null) {
      synchronized (DriverServiceGrpc.class) {
        if ((getStopExecutionMethod = DriverServiceGrpc.getStopExecutionMethod) == null) {
          DriverServiceGrpc.getStopExecutionMethod = getStopExecutionMethod =
              io.grpc.MethodDescriptor.<app.usbuitest.android.grpc.StopExecutionRequest, app.usbuitest.android.grpc.ActionResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "StopExecution"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.StopExecutionRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  app.usbuitest.android.grpc.ActionResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getStopExecutionMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static DriverServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<DriverServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<DriverServiceStub>() {
        @java.lang.Override
        public DriverServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new DriverServiceStub(channel, callOptions);
        }
      };
    return DriverServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static DriverServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<DriverServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<DriverServiceBlockingStub>() {
        @java.lang.Override
        public DriverServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new DriverServiceBlockingStub(channel, callOptions);
        }
      };
    return DriverServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static DriverServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<DriverServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<DriverServiceFutureStub>() {
        @java.lang.Override
        public DriverServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new DriverServiceFutureStub(channel, callOptions);
        }
      };
    return DriverServiceFutureStub.newStub(factory, channel);
  }

  /**
   */
  public interface AsyncService {

    /**
     * <pre>
     * Device interaction actions
     * </pre>
     */
    default void tap(app.usbuitest.android.grpc.TapRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.TapResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getTapMethod(), responseObserver);
    }

    /**
     */
    default void tapPercent(app.usbuitest.android.grpc.TapPercentRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.TapResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getTapPercentMethod(), responseObserver);
    }

    /**
     */
    default void enterText(app.usbuitest.android.grpc.EnterTextRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getEnterTextMethod(), responseObserver);
    }

    /**
     */
    default void eraseText(app.usbuitest.android.grpc.EraseTextRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getEraseTextMethod(), responseObserver);
    }

    /**
     */
    default void copyText(app.usbuitest.android.grpc.CopyTextRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCopyTextMethod(), responseObserver);
    }

    /**
     */
    default void pasteText(app.usbuitest.android.grpc.PasteTextRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getPasteTextMethod(), responseObserver);
    }

    /**
     */
    default void back(app.usbuitest.android.grpc.BackRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getBackMethod(), responseObserver);
    }

    /**
     */
    default void home(app.usbuitest.android.grpc.HomeRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getHomeMethod(), responseObserver);
    }

    /**
     */
    default void rotate(app.usbuitest.android.grpc.RotateRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.RotateResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRotateMethod(), responseObserver);
    }

    /**
     */
    default void hideKeyboard(app.usbuitest.android.grpc.HideKeyboardRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getHideKeyboardMethod(), responseObserver);
    }

    /**
     */
    default void pressKey(app.usbuitest.android.grpc.PressKeyRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getPressKeyMethod(), responseObserver);
    }

    /**
     */
    default void swipe(app.usbuitest.android.grpc.SwipeRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSwipeMethod(), responseObserver);
    }

    /**
     * <pre>
     * App management
     * </pre>
     */
    default void launchApp(app.usbuitest.android.grpc.LaunchAppRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getLaunchAppMethod(), responseObserver);
    }

    /**
     */
    default void killApp(app.usbuitest.android.grpc.KillAppRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getKillAppMethod(), responseObserver);
    }

    /**
     */
    default void switchToPrimaryApp(app.usbuitest.android.grpc.SwitchToPrimaryAppRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSwitchToPrimaryAppMethod(), responseObserver);
    }

    /**
     */
    default void checkAppInForeground(app.usbuitest.android.grpc.CheckAppInForegroundRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getCheckAppInForegroundMethod(), responseObserver);
    }

    /**
     */
    default void getAppList(app.usbuitest.android.grpc.GetAppListRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.AppListResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetAppListMethod(), responseObserver);
    }

    /**
     */
    default void updateAppIds(app.usbuitest.android.grpc.UpdateAppIdsRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getUpdateAppIdsMethod(), responseObserver);
    }

    /**
     * <pre>
     * Device info
     * </pre>
     */
    default void getDeviceScale(app.usbuitest.android.grpc.GetDeviceScaleRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.DeviceScaleResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetDeviceScaleMethod(), responseObserver);
    }

    /**
     */
    default void getScreenDimension(app.usbuitest.android.grpc.GetScreenDimensionRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenDimensionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetScreenDimensionMethod(), responseObserver);
    }

    /**
     */
    default void setLocation(app.usbuitest.android.grpc.SetLocationRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getSetLocationMethod(), responseObserver);
    }

    /**
     * <pre>
     * Screenshot and hierarchy
     * </pre>
     */
    default void getScreenshot(app.usbuitest.android.grpc.GetScreenshotRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetScreenshotMethod(), responseObserver);
    }

    /**
     */
    default void getHierarchy(app.usbuitest.android.grpc.GetHierarchyRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetHierarchyMethod(), responseObserver);
    }

    /**
     */
    default void getScreenshotAndHierarchy(app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetScreenshotAndHierarchyMethod(), responseObserver);
    }

    /**
     * <pre>
     * Raw screenshot for comparison (stability checking) - faster than base64
     * </pre>
     */
    default void getRawScreenshot(app.usbuitest.android.grpc.GetRawScreenshotRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.RawScreenshotResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getGetRawScreenshotMethod(), responseObserver);
    }

    /**
     * <pre>
     * Streaming - Server streaming RPC
     * </pre>
     */
    default void startStreaming(app.usbuitest.android.grpc.StartStreamingRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.StreamFrame> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getStartStreamingMethod(), responseObserver);
    }

    /**
     * <pre>
     * Execution control
     * </pre>
     */
    default void stopStreaming(app.usbuitest.android.grpc.StopStreamingRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getStopStreamingMethod(), responseObserver);
    }

    /**
     */
    default void stopExecution(app.usbuitest.android.grpc.StopExecutionRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getStopExecutionMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service DriverService.
   */
  public static abstract class DriverServiceImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return DriverServiceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service DriverService.
   */
  public static final class DriverServiceStub
      extends io.grpc.stub.AbstractAsyncStub<DriverServiceStub> {
    private DriverServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected DriverServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new DriverServiceStub(channel, callOptions);
    }

    /**
     * <pre>
     * Device interaction actions
     * </pre>
     */
    public void tap(app.usbuitest.android.grpc.TapRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.TapResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getTapMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void tapPercent(app.usbuitest.android.grpc.TapPercentRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.TapResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getTapPercentMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void enterText(app.usbuitest.android.grpc.EnterTextRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getEnterTextMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void eraseText(app.usbuitest.android.grpc.EraseTextRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getEraseTextMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void copyText(app.usbuitest.android.grpc.CopyTextRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCopyTextMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void pasteText(app.usbuitest.android.grpc.PasteTextRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getPasteTextMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void back(app.usbuitest.android.grpc.BackRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getBackMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void home(app.usbuitest.android.grpc.HomeRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getHomeMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void rotate(app.usbuitest.android.grpc.RotateRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.RotateResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRotateMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void hideKeyboard(app.usbuitest.android.grpc.HideKeyboardRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getHideKeyboardMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void pressKey(app.usbuitest.android.grpc.PressKeyRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getPressKeyMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void swipe(app.usbuitest.android.grpc.SwipeRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSwipeMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * App management
     * </pre>
     */
    public void launchApp(app.usbuitest.android.grpc.LaunchAppRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getLaunchAppMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void killApp(app.usbuitest.android.grpc.KillAppRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getKillAppMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void switchToPrimaryApp(app.usbuitest.android.grpc.SwitchToPrimaryAppRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSwitchToPrimaryAppMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void checkAppInForeground(app.usbuitest.android.grpc.CheckAppInForegroundRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getCheckAppInForegroundMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getAppList(app.usbuitest.android.grpc.GetAppListRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.AppListResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetAppListMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void updateAppIds(app.usbuitest.android.grpc.UpdateAppIdsRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getUpdateAppIdsMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Device info
     * </pre>
     */
    public void getDeviceScale(app.usbuitest.android.grpc.GetDeviceScaleRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.DeviceScaleResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetDeviceScaleMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getScreenDimension(app.usbuitest.android.grpc.GetScreenDimensionRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenDimensionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetScreenDimensionMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void setLocation(app.usbuitest.android.grpc.SetLocationRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getSetLocationMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Screenshot and hierarchy
     * </pre>
     */
    public void getScreenshot(app.usbuitest.android.grpc.GetScreenshotRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetScreenshotMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getHierarchy(app.usbuitest.android.grpc.GetHierarchyRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetHierarchyMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void getScreenshotAndHierarchy(app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetScreenshotAndHierarchyMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Raw screenshot for comparison (stability checking) - faster than base64
     * </pre>
     */
    public void getRawScreenshot(app.usbuitest.android.grpc.GetRawScreenshotRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.RawScreenshotResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getGetRawScreenshotMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Streaming - Server streaming RPC
     * </pre>
     */
    public void startStreaming(app.usbuitest.android.grpc.StartStreamingRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.StreamFrame> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getStartStreamingMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Execution control
     * </pre>
     */
    public void stopStreaming(app.usbuitest.android.grpc.StopStreamingRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getStopStreamingMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     */
    public void stopExecution(app.usbuitest.android.grpc.StopExecutionRequest request,
        io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getStopExecutionMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service DriverService.
   */
  public static final class DriverServiceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<DriverServiceBlockingStub> {
    private DriverServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected DriverServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new DriverServiceBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Device interaction actions
     * </pre>
     */
    public app.usbuitest.android.grpc.TapResponse tap(app.usbuitest.android.grpc.TapRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getTapMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.TapResponse tapPercent(app.usbuitest.android.grpc.TapPercentRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getTapPercentMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse enterText(app.usbuitest.android.grpc.EnterTextRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getEnterTextMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse eraseText(app.usbuitest.android.grpc.EraseTextRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getEraseTextMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse copyText(app.usbuitest.android.grpc.CopyTextRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCopyTextMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse pasteText(app.usbuitest.android.grpc.PasteTextRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getPasteTextMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse back(app.usbuitest.android.grpc.BackRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getBackMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse home(app.usbuitest.android.grpc.HomeRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getHomeMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.RotateResponse rotate(app.usbuitest.android.grpc.RotateRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRotateMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse hideKeyboard(app.usbuitest.android.grpc.HideKeyboardRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getHideKeyboardMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse pressKey(app.usbuitest.android.grpc.PressKeyRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getPressKeyMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse swipe(app.usbuitest.android.grpc.SwipeRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSwipeMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * App management
     * </pre>
     */
    public app.usbuitest.android.grpc.ActionResponse launchApp(app.usbuitest.android.grpc.LaunchAppRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getLaunchAppMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse killApp(app.usbuitest.android.grpc.KillAppRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getKillAppMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse switchToPrimaryApp(app.usbuitest.android.grpc.SwitchToPrimaryAppRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSwitchToPrimaryAppMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse checkAppInForeground(app.usbuitest.android.grpc.CheckAppInForegroundRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getCheckAppInForegroundMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.AppListResponse getAppList(app.usbuitest.android.grpc.GetAppListRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetAppListMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse updateAppIds(app.usbuitest.android.grpc.UpdateAppIdsRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getUpdateAppIdsMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Device info
     * </pre>
     */
    public app.usbuitest.android.grpc.DeviceScaleResponse getDeviceScale(app.usbuitest.android.grpc.GetDeviceScaleRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetDeviceScaleMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ScreenDimensionResponse getScreenDimension(app.usbuitest.android.grpc.GetScreenDimensionRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetScreenDimensionMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse setLocation(app.usbuitest.android.grpc.SetLocationRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getSetLocationMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Screenshot and hierarchy
     * </pre>
     */
    public app.usbuitest.android.grpc.ScreenshotResponse getScreenshot(app.usbuitest.android.grpc.GetScreenshotRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetScreenshotMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ScreenshotResponse getHierarchy(app.usbuitest.android.grpc.GetHierarchyRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetHierarchyMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ScreenshotResponse getScreenshotAndHierarchy(app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetScreenshotAndHierarchyMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Raw screenshot for comparison (stability checking) - faster than base64
     * </pre>
     */
    public app.usbuitest.android.grpc.RawScreenshotResponse getRawScreenshot(app.usbuitest.android.grpc.GetRawScreenshotRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getGetRawScreenshotMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Streaming - Server streaming RPC
     * </pre>
     */
    public java.util.Iterator<app.usbuitest.android.grpc.StreamFrame> startStreaming(
        app.usbuitest.android.grpc.StartStreamingRequest request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getStartStreamingMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Execution control
     * </pre>
     */
    public app.usbuitest.android.grpc.ActionResponse stopStreaming(app.usbuitest.android.grpc.StopStreamingRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getStopStreamingMethod(), getCallOptions(), request);
    }

    /**
     */
    public app.usbuitest.android.grpc.ActionResponse stopExecution(app.usbuitest.android.grpc.StopExecutionRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getStopExecutionMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service DriverService.
   */
  public static final class DriverServiceFutureStub
      extends io.grpc.stub.AbstractFutureStub<DriverServiceFutureStub> {
    private DriverServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected DriverServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new DriverServiceFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Device interaction actions
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.TapResponse> tap(
        app.usbuitest.android.grpc.TapRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getTapMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.TapResponse> tapPercent(
        app.usbuitest.android.grpc.TapPercentRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getTapPercentMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> enterText(
        app.usbuitest.android.grpc.EnterTextRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getEnterTextMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> eraseText(
        app.usbuitest.android.grpc.EraseTextRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getEraseTextMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> copyText(
        app.usbuitest.android.grpc.CopyTextRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCopyTextMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> pasteText(
        app.usbuitest.android.grpc.PasteTextRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getPasteTextMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> back(
        app.usbuitest.android.grpc.BackRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getBackMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> home(
        app.usbuitest.android.grpc.HomeRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getHomeMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.RotateResponse> rotate(
        app.usbuitest.android.grpc.RotateRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRotateMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> hideKeyboard(
        app.usbuitest.android.grpc.HideKeyboardRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getHideKeyboardMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> pressKey(
        app.usbuitest.android.grpc.PressKeyRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getPressKeyMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> swipe(
        app.usbuitest.android.grpc.SwipeRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSwipeMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * App management
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> launchApp(
        app.usbuitest.android.grpc.LaunchAppRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getLaunchAppMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> killApp(
        app.usbuitest.android.grpc.KillAppRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getKillAppMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> switchToPrimaryApp(
        app.usbuitest.android.grpc.SwitchToPrimaryAppRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSwitchToPrimaryAppMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> checkAppInForeground(
        app.usbuitest.android.grpc.CheckAppInForegroundRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getCheckAppInForegroundMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.AppListResponse> getAppList(
        app.usbuitest.android.grpc.GetAppListRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetAppListMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> updateAppIds(
        app.usbuitest.android.grpc.UpdateAppIdsRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getUpdateAppIdsMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Device info
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.DeviceScaleResponse> getDeviceScale(
        app.usbuitest.android.grpc.GetDeviceScaleRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetDeviceScaleMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ScreenDimensionResponse> getScreenDimension(
        app.usbuitest.android.grpc.GetScreenDimensionRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetScreenDimensionMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> setLocation(
        app.usbuitest.android.grpc.SetLocationRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getSetLocationMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Screenshot and hierarchy
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ScreenshotResponse> getScreenshot(
        app.usbuitest.android.grpc.GetScreenshotRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetScreenshotMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ScreenshotResponse> getHierarchy(
        app.usbuitest.android.grpc.GetHierarchyRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetHierarchyMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ScreenshotResponse> getScreenshotAndHierarchy(
        app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetScreenshotAndHierarchyMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Raw screenshot for comparison (stability checking) - faster than base64
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.RawScreenshotResponse> getRawScreenshot(
        app.usbuitest.android.grpc.GetRawScreenshotRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getGetRawScreenshotMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Execution control
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> stopStreaming(
        app.usbuitest.android.grpc.StopStreamingRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getStopStreamingMethod(), getCallOptions()), request);
    }

    /**
     */
    public com.google.common.util.concurrent.ListenableFuture<app.usbuitest.android.grpc.ActionResponse> stopExecution(
        app.usbuitest.android.grpc.StopExecutionRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getStopExecutionMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_TAP = 0;
  private static final int METHODID_TAP_PERCENT = 1;
  private static final int METHODID_ENTER_TEXT = 2;
  private static final int METHODID_ERASE_TEXT = 3;
  private static final int METHODID_COPY_TEXT = 4;
  private static final int METHODID_PASTE_TEXT = 5;
  private static final int METHODID_BACK = 6;
  private static final int METHODID_HOME = 7;
  private static final int METHODID_ROTATE = 8;
  private static final int METHODID_HIDE_KEYBOARD = 9;
  private static final int METHODID_PRESS_KEY = 10;
  private static final int METHODID_SWIPE = 11;
  private static final int METHODID_LAUNCH_APP = 12;
  private static final int METHODID_KILL_APP = 13;
  private static final int METHODID_SWITCH_TO_PRIMARY_APP = 14;
  private static final int METHODID_CHECK_APP_IN_FOREGROUND = 15;
  private static final int METHODID_GET_APP_LIST = 16;
  private static final int METHODID_UPDATE_APP_IDS = 17;
  private static final int METHODID_GET_DEVICE_SCALE = 18;
  private static final int METHODID_GET_SCREEN_DIMENSION = 19;
  private static final int METHODID_SET_LOCATION = 20;
  private static final int METHODID_GET_SCREENSHOT = 21;
  private static final int METHODID_GET_HIERARCHY = 22;
  private static final int METHODID_GET_SCREENSHOT_AND_HIERARCHY = 23;
  private static final int METHODID_GET_RAW_SCREENSHOT = 24;
  private static final int METHODID_START_STREAMING = 25;
  private static final int METHODID_STOP_STREAMING = 26;
  private static final int METHODID_STOP_EXECUTION = 27;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_TAP:
          serviceImpl.tap((app.usbuitest.android.grpc.TapRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.TapResponse>) responseObserver);
          break;
        case METHODID_TAP_PERCENT:
          serviceImpl.tapPercent((app.usbuitest.android.grpc.TapPercentRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.TapResponse>) responseObserver);
          break;
        case METHODID_ENTER_TEXT:
          serviceImpl.enterText((app.usbuitest.android.grpc.EnterTextRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_ERASE_TEXT:
          serviceImpl.eraseText((app.usbuitest.android.grpc.EraseTextRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_COPY_TEXT:
          serviceImpl.copyText((app.usbuitest.android.grpc.CopyTextRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_PASTE_TEXT:
          serviceImpl.pasteText((app.usbuitest.android.grpc.PasteTextRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_BACK:
          serviceImpl.back((app.usbuitest.android.grpc.BackRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_HOME:
          serviceImpl.home((app.usbuitest.android.grpc.HomeRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_ROTATE:
          serviceImpl.rotate((app.usbuitest.android.grpc.RotateRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.RotateResponse>) responseObserver);
          break;
        case METHODID_HIDE_KEYBOARD:
          serviceImpl.hideKeyboard((app.usbuitest.android.grpc.HideKeyboardRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_PRESS_KEY:
          serviceImpl.pressKey((app.usbuitest.android.grpc.PressKeyRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_SWIPE:
          serviceImpl.swipe((app.usbuitest.android.grpc.SwipeRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_LAUNCH_APP:
          serviceImpl.launchApp((app.usbuitest.android.grpc.LaunchAppRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_KILL_APP:
          serviceImpl.killApp((app.usbuitest.android.grpc.KillAppRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_SWITCH_TO_PRIMARY_APP:
          serviceImpl.switchToPrimaryApp((app.usbuitest.android.grpc.SwitchToPrimaryAppRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_CHECK_APP_IN_FOREGROUND:
          serviceImpl.checkAppInForeground((app.usbuitest.android.grpc.CheckAppInForegroundRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_GET_APP_LIST:
          serviceImpl.getAppList((app.usbuitest.android.grpc.GetAppListRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.AppListResponse>) responseObserver);
          break;
        case METHODID_UPDATE_APP_IDS:
          serviceImpl.updateAppIds((app.usbuitest.android.grpc.UpdateAppIdsRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_GET_DEVICE_SCALE:
          serviceImpl.getDeviceScale((app.usbuitest.android.grpc.GetDeviceScaleRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.DeviceScaleResponse>) responseObserver);
          break;
        case METHODID_GET_SCREEN_DIMENSION:
          serviceImpl.getScreenDimension((app.usbuitest.android.grpc.GetScreenDimensionRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenDimensionResponse>) responseObserver);
          break;
        case METHODID_SET_LOCATION:
          serviceImpl.setLocation((app.usbuitest.android.grpc.SetLocationRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_GET_SCREENSHOT:
          serviceImpl.getScreenshot((app.usbuitest.android.grpc.GetScreenshotRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse>) responseObserver);
          break;
        case METHODID_GET_HIERARCHY:
          serviceImpl.getHierarchy((app.usbuitest.android.grpc.GetHierarchyRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse>) responseObserver);
          break;
        case METHODID_GET_SCREENSHOT_AND_HIERARCHY:
          serviceImpl.getScreenshotAndHierarchy((app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ScreenshotResponse>) responseObserver);
          break;
        case METHODID_GET_RAW_SCREENSHOT:
          serviceImpl.getRawScreenshot((app.usbuitest.android.grpc.GetRawScreenshotRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.RawScreenshotResponse>) responseObserver);
          break;
        case METHODID_START_STREAMING:
          serviceImpl.startStreaming((app.usbuitest.android.grpc.StartStreamingRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.StreamFrame>) responseObserver);
          break;
        case METHODID_STOP_STREAMING:
          serviceImpl.stopStreaming((app.usbuitest.android.grpc.StopStreamingRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        case METHODID_STOP_EXECUTION:
          serviceImpl.stopExecution((app.usbuitest.android.grpc.StopExecutionRequest) request,
              (io.grpc.stub.StreamObserver<app.usbuitest.android.grpc.ActionResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getTapMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.TapRequest,
              app.usbuitest.android.grpc.TapResponse>(
                service, METHODID_TAP)))
        .addMethod(
          getTapPercentMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.TapPercentRequest,
              app.usbuitest.android.grpc.TapResponse>(
                service, METHODID_TAP_PERCENT)))
        .addMethod(
          getEnterTextMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.EnterTextRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_ENTER_TEXT)))
        .addMethod(
          getEraseTextMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.EraseTextRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_ERASE_TEXT)))
        .addMethod(
          getCopyTextMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.CopyTextRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_COPY_TEXT)))
        .addMethod(
          getPasteTextMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.PasteTextRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_PASTE_TEXT)))
        .addMethod(
          getBackMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.BackRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_BACK)))
        .addMethod(
          getHomeMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.HomeRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_HOME)))
        .addMethod(
          getRotateMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.RotateRequest,
              app.usbuitest.android.grpc.RotateResponse>(
                service, METHODID_ROTATE)))
        .addMethod(
          getHideKeyboardMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.HideKeyboardRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_HIDE_KEYBOARD)))
        .addMethod(
          getPressKeyMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.PressKeyRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_PRESS_KEY)))
        .addMethod(
          getSwipeMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.SwipeRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_SWIPE)))
        .addMethod(
          getLaunchAppMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.LaunchAppRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_LAUNCH_APP)))
        .addMethod(
          getKillAppMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.KillAppRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_KILL_APP)))
        .addMethod(
          getSwitchToPrimaryAppMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.SwitchToPrimaryAppRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_SWITCH_TO_PRIMARY_APP)))
        .addMethod(
          getCheckAppInForegroundMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.CheckAppInForegroundRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_CHECK_APP_IN_FOREGROUND)))
        .addMethod(
          getGetAppListMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.GetAppListRequest,
              app.usbuitest.android.grpc.AppListResponse>(
                service, METHODID_GET_APP_LIST)))
        .addMethod(
          getUpdateAppIdsMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.UpdateAppIdsRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_UPDATE_APP_IDS)))
        .addMethod(
          getGetDeviceScaleMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.GetDeviceScaleRequest,
              app.usbuitest.android.grpc.DeviceScaleResponse>(
                service, METHODID_GET_DEVICE_SCALE)))
        .addMethod(
          getGetScreenDimensionMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.GetScreenDimensionRequest,
              app.usbuitest.android.grpc.ScreenDimensionResponse>(
                service, METHODID_GET_SCREEN_DIMENSION)))
        .addMethod(
          getSetLocationMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.SetLocationRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_SET_LOCATION)))
        .addMethod(
          getGetScreenshotMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.GetScreenshotRequest,
              app.usbuitest.android.grpc.ScreenshotResponse>(
                service, METHODID_GET_SCREENSHOT)))
        .addMethod(
          getGetHierarchyMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.GetHierarchyRequest,
              app.usbuitest.android.grpc.ScreenshotResponse>(
                service, METHODID_GET_HIERARCHY)))
        .addMethod(
          getGetScreenshotAndHierarchyMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.GetScreenshotAndHierarchyRequest,
              app.usbuitest.android.grpc.ScreenshotResponse>(
                service, METHODID_GET_SCREENSHOT_AND_HIERARCHY)))
        .addMethod(
          getGetRawScreenshotMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.GetRawScreenshotRequest,
              app.usbuitest.android.grpc.RawScreenshotResponse>(
                service, METHODID_GET_RAW_SCREENSHOT)))
        .addMethod(
          getStartStreamingMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.StartStreamingRequest,
              app.usbuitest.android.grpc.StreamFrame>(
                service, METHODID_START_STREAMING)))
        .addMethod(
          getStopStreamingMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.StopStreamingRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_STOP_STREAMING)))
        .addMethod(
          getStopExecutionMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              app.usbuitest.android.grpc.StopExecutionRequest,
              app.usbuitest.android.grpc.ActionResponse>(
                service, METHODID_STOP_EXECUTION)))
        .build();
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (DriverServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .addMethod(getTapMethod())
              .addMethod(getTapPercentMethod())
              .addMethod(getEnterTextMethod())
              .addMethod(getEraseTextMethod())
              .addMethod(getCopyTextMethod())
              .addMethod(getPasteTextMethod())
              .addMethod(getBackMethod())
              .addMethod(getHomeMethod())
              .addMethod(getRotateMethod())
              .addMethod(getHideKeyboardMethod())
              .addMethod(getPressKeyMethod())
              .addMethod(getSwipeMethod())
              .addMethod(getLaunchAppMethod())
              .addMethod(getKillAppMethod())
              .addMethod(getSwitchToPrimaryAppMethod())
              .addMethod(getCheckAppInForegroundMethod())
              .addMethod(getGetAppListMethod())
              .addMethod(getUpdateAppIdsMethod())
              .addMethod(getGetDeviceScaleMethod())
              .addMethod(getGetScreenDimensionMethod())
              .addMethod(getSetLocationMethod())
              .addMethod(getGetScreenshotMethod())
              .addMethod(getGetHierarchyMethod())
              .addMethod(getGetScreenshotAndHierarchyMethod())
              .addMethod(getGetRawScreenshotMethod())
              .addMethod(getStartStreamingMethod())
              .addMethod(getStopStreamingMethod())
              .addMethod(getStopExecutionMethod())
              .build();
        }
      }
    }
    return result;
  }
}
