import toast from "react-hot-toast";

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: "top-center",
      style: {
        background:
          "linear-gradient(170deg, #ffe682 0%, #ffd44c 52%, #f9c900 100%)",
        color: "#110814",
        fontWeight: "600",
        borderRadius: "12px",
        padding: "12px 20px",
      },
      iconTheme: {
        primary: "#110814",
        secondary: "#ffd44c",
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: "top-center",
      style: {
        background: "#ff6b7a",
        color: "#ffffff",
        fontWeight: "600",
        borderRadius: "12px",
        padding: "12px 20px",
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: "top-center",
      style: {
        background: "color-mix(in oklab, #241246 90%, white 10%)",
        color: "#f7f5ff",
        fontWeight: "600",
        borderRadius: "12px",
        padding: "12px 20px",
        border: "1px solid color-mix(in oklab, #4f2f8c 70%, white 30%)",
      },
    });
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: {
          borderRadius: "12px",
          padding: "12px 20px",
          fontWeight: "600",
        },
        success: {
          duration: 3000,
          style: {
            background:
              "linear-gradient(170deg, #ffe682 0%, #ffd44c 52%, #f9c900 100%)",
            color: "#110814",
          },
        },
        error: {
          duration: 4000,
          style: {
            background: "#ff6b7a",
            color: "#ffffff",
          },
        },
      },
    );
  },
};
