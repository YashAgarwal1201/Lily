import { useForm } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { FeedbackFormType } from "../../Services/interfacesAndTypes";
// import { Toast } from "primereact/toast";
// import { useRef } from "react";

const FeedbackPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FeedbackFormType>();
  // const toast = useRef(null);

  const onSubmit = (data: any) => {
    console.log(data); // Log or replace this with an API call
    reset(); // Reset form fields after submission
  };

  // Function to handle discarding the form
  const handleDiscard = () => {
    reset(); // Clears all form fields
  };

  return (
    <div className="w-full h-full p-1 sm:p-2 mdl:p-3 2xl:px-5 bg-color3 rounded-lg flex flex-col items-center justify-center">
      {/* <Toast ref={toast} /> */}
      <div className="card w-full max-w-xl bg-color4 p-4 rounded-md">
        <form onSubmit={handleSubmit(onSubmit)} className="p-fluid text-color5">
          <h2 className="text-center text-lg sm:text-xl mdl:text-2xl font-medium">
            Your Feedback
          </h2>
          <div className="field mt-4">
            <label htmlFor="name" className="block mb-2">
              Name
            </label>
            <InputText
              id="name"
              {...register("name", { required: true })}
              className={`w-full p-2 ${
                errors.name ? "p-invalid" : ""
              } bg-color2`}
            />
            {errors.name && (
              <small className="p-error">Name is required.</small>
            )}
          </div>
          <div className="field mt-4">
            <label htmlFor="email" className="block mb-2">
              Email
            </label>
            <InputText
              id="email"
              {...register("email", {
                required: true,
                pattern: /^\S+@\S+\.\S+$/,
              })}
              className={`w-full p-2 ${
                errors.email ? "p-invalid" : ""
              } bg-color2`}
            />
            {errors.email && (
              <small className="p-error">A valid email is required.</small>
            )}
          </div>
          <div className="field mt-4">
            <label htmlFor="feedback" className="block mb-2">
              Feedback
            </label>
            <InputTextarea
              id="feedback"
              {...register("message", { required: true })}
              rows={5}
              className={`w-full p-2 ${
                errors.message ? "p-invalid" : ""
              } bg-color2 resize-none`}
            />
            {errors.message && (
              <small className="p-error">Feedback is required.</small>
            )}
          </div>
          <div className="flex justify-center gap-x-2 mt-6">
            <Button
              type="submit"
              icon={"pi pi-send"}
              label="Submit"
              className="w-fit py-2 px-4 bg-color1 text-color2"
            />
            <Button
              type="button"
              icon="pi pi-trash"
              label="Discard"
              className="w-fit py-2 px-4 bg-transparent text-color1"
              onClick={handleDiscard}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
