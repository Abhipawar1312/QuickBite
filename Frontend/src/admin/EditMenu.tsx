"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type MenuFormSchema, menuSchema } from "@/schema/menuSchema";
import { useMenuStore } from "@/store/useMenuStore";
import type { MenuItem } from "@/types/restaurantType";
import {
  Loader2,
  Edit3,
  ImageIcon,
  IndianRupee,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useState,
} from "react";
import { motion } from "framer-motion";

// Extended form schema to include availability
interface ExtendedMenuFormSchema extends MenuFormSchema {
  availability: "Available" | "Out of Stock";
}

const EditMenu = ({
  selectedMenu,
  editOpen,
  setEditOpen,
}: {
  selectedMenu: MenuItem;
  editOpen: boolean;
  setEditOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [input, setInput] = useState<ExtendedMenuFormSchema>({
    name: "",
    description: "",
    price: 0,
    image: undefined,
    availability: "Available",
  });
  const [error, setError] = useState<Partial<MenuFormSchema>>({});
  const { loading, editMenu } = useMenuStore();

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setInput({ ...input, [name]: type === "number" ? Number(value) : value });
  };

  const handleAvailabilityChange = (checked: boolean) => {
    setInput({
      ...input,
      availability: checked ? "Available" : "Out of Stock",
    });
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Clear previous errors
    setError({});
    // Validate basic menu schema (excluding availability for now)
    const basicInput = {
      name: input.name,
      description: input.description,
      price: input.price,
      image: input.image,
    };
    const result = menuSchema.safeParse(basicInput);
    if (!result.success) {
      const fieldErrors = result.error.formErrors.fieldErrors;
      setError(fieldErrors as Partial<MenuFormSchema>);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", input.name);
      formData.append("description", input.description);
      formData.append("price", input.price.toString());
      formData.append("availability", input.availability);
      if (input.image) {
        formData.append("image", input.image);
      }
      // Wait for the edit operation to complete
      await editMenu(selectedMenu._id, formData);
      // Close dialog and reset form on success
      setEditOpen(false);
      setInput({
        name: "",
        description: "",
        price: 0,
        image: undefined,
        availability: "Available",
      });
      setError({});
    } catch (error) {
      console.log(error);
      // You might want to show an error message to the user here
    }
  };

  useEffect(() => {
    if (selectedMenu) {
      setInput({
        name: selectedMenu?.name || "",
        description: selectedMenu?.description || "",
        price: selectedMenu?.price || 0,
        image: undefined,
        availability: selectedMenu?.availability || "Available",
      });
      // Clear errors when opening dialog
      setError({});
    }
  }, [selectedMenu, editOpen]);

  return (
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-md mx-auto bg-white dark:bg-slate-800 border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Edit3 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Edit Menu
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Update your menu to keep your offerings fresh and exciting!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitHandler} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Name
              </Label>
              <Input
                type="text"
                name="name"
                value={input.name}
                onChange={changeEventHandler}
                placeholder="Enter menu name"
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300"
              />
              {error.name && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-red-600"
                >
                  {error.name}
                </motion.span>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Description
              </Label>
              <Input
                type="text"
                name="description"
                value={input.description}
                onChange={changeEventHandler}
                placeholder="Enter menu description"
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300"
              />
              {error.description && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-red-600"
                >
                  {error.description}
                </motion.span>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Price (₹)
              </Label>
              <Input
                type="number"
                name="price"
                value={input.price}
                onChange={changeEventHandler}
                placeholder="Enter menu price"
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-300"
              />
              {error.price && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-red-600"
                >
                  {error.price}
                </motion.span>
              )}
            </div>
            {/* Availability Toggle */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Availability Status
              </Label>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border-2 border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-3">
                  {input.availability === "Available" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {input.availability === "Available"
                        ? "Available"
                        : "Out of Stock"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {input.availability === "Available"
                        ? "Customers can order this item"
                        : "This item is currently unavailable"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={input.availability === "Available"}
                  onCheckedChange={handleAvailabilityChange}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Upload Menu Image
              </Label>
              <Input
                type="file"
                name="image"
                accept="image/*"
                onChange={(e) =>
                  setInput({
                    ...input,
                    image: e.target.files?.[0] || undefined,
                  })
                }
                className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {error.image && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-red-600"
                >
                  {error.image?.name}
                </motion.span>
              )}
            </div>
            <DialogFooter className="pt-6">
              {loading ? (
                <Button
                  disabled
                  type="button"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold"
                >
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Update Menu
                  </Button>
                </motion.div>
              )}
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMenu;
