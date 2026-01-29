"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type MenuFormSchema, menuSchema } from "@/schema/menuSchema";
import {
  Loader2,
  Plus,
  Edit,
  IndianRupee,
  ImageIcon,
  ChefHat,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type React from "react";
import { type FormEvent, useEffect, useState } from "react";
import EditMenu from "./EditMenu";
import { useMenuStore } from "@/store/useMenuStore";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { motion, AnimatePresence } from "framer-motion";

const AddMenu = () => {
  const [input, setInput] = useState<MenuFormSchema>({
    name: "",
    description: "",
    price: 0,
    image: undefined,
  });
  const [open, setOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<any>();
  const [error, setError] = useState<Partial<MenuFormSchema>>({});

  const { loading, createMenu, deleteMenu, toggleMenuAvailability } =
    useMenuStore();
  const { restaurant, getRestaurant, clearRestaurantData } =
    useRestaurantStore();

  const changeEventHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setInput({ ...input, [name]: type === "number" ? Number(value) : value });
  };

  const submitHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Clear previous errors
    setError({});
    const result = menuSchema.safeParse(input);
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
      if (input.image) {
        formData.append("image", input.image);
      }
      // Wait for the create operation to complete
      await createMenu(formData);
      // Close dialog and reset form on success
      setOpen(false);
      setInput({
        name: "",
        description: "",
        price: 0,
        image: undefined,
      });
      setError({});
    } catch (error) {
      console.log(error);
      // You might want to show an error message to the user here
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    try {
      await deleteMenu(menuId);
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleAvailability = async (
    menuId: string,
    currentAvailability: string
  ) => {
    try {
      const newAvailability =
        currentAvailability === "Available" ? "Out of Stock" : "Available";
      await toggleMenuAvailability(menuId, newAvailability);
    } catch (error) {
      console.log(error);
    }
  };

  // Reset form when dialog opens
  const handleDialogOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setInput({
        name: "",
        description: "",
        price: 0,
        image: undefined,
      });
      setError({});
    }
  };

  useEffect(() => {
    // Clear any cached data first to ensure fresh data for new admin
    clearRestaurantData();
    const fetchRestaurant = async () => {
      await getRestaurant();
    };
    fetchRestaurant();
  }, []); // Remove restaurant dependency to avoid infinite loop

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
              Available Menus
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your restaurant's delicious offerings
            </p>
          </div>

          <Dialog open={open} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="mr-2 w-5 h-5" />
                  Add Menu
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto bg-white dark:bg-slate-800 border-0 shadow-2xl rounded-2xl">
              <DialogHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Add New Menu
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  Create a menu that will make your restaurant stand out.
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
                    className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-300"
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
                    className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-300"
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
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Price (₹)
                  </Label>
                  <Input
                    type="number"
                    name="price"
                    value={input.price}
                    onChange={changeEventHandler}
                    placeholder="Enter menu price"
                    className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all duration-300"
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
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Upload Menu Image
                  </Label>
                  <Input
                    type="file"
                    data-testid="menu-image-input"
                    name="image"
                    accept="image/*"
                    onChange={(e) =>
                      setInput({
                        ...input,
                        image: e.target.files?.[0] || undefined,
                      })
                    }
                    className="h-12 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
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
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold"
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
                        className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Submit
                      </Button>
                    </motion.div>
                  )}
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Menu Items */}
        <div className="space-y-6">
          <AnimatePresence>
            {restaurant?.menus.map((menu: any, idx: number) => (
              <motion.div
                key={menu._id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Image */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative overflow-hidden rounded-xl"
                  >
                    <img
                      src={menu.image || "/placeholder.svg"}
                      alt={menu.name}
                      className="w-full lg:w-24 lg:h-24 h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* Availability Badge */}
                    <div className="absolute top-2 right-2">
                      {menu.availability === "Available" ? (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Available
                        </div>
                      ) : (
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Out of Stock
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                      {menu.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {menu.description}
                    </p>
                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                      <IndianRupee className="w-4 h-4" />
                      <span className="text-lg font-bold">{menu.price}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-4 lg:min-w-[200px]">
                    {/* Availability Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Available
                      </span>
                      <Switch
                        checked={menu.availability === "Available"}
                        onCheckedChange={() =>
                          handleToggleAvailability(menu._id, menu.availability)
                        }
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1"
                      >
                        <Button
                          onClick={() => {
                            setSelectedMenu(menu);
                            setEditOpen(true);
                          }}
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </motion.div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1"
                          >
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </motion.div>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-slate-800 border-0 shadow-2xl rounded-2xl">
                          <AlertDialogHeader>
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <AlertDialogTitle className="text-center text-xl font-bold text-slate-900 dark:text-white">
                              Delete Menu Item
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-center text-slate-600 dark:text-slate-400">
                              Are you sure you want to delete "{menu.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex gap-3 pt-6">
                            <AlertDialogCancel className="flex-1 h-12 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-800 font-semibold">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMenu(menu._id)}
                              className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 w-4 h-4" />
                                  Delete
                                </>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {(!restaurant?.menus || restaurant.menus.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700"
            >
              <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No menu items yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Start by adding your first delicious menu item
              </p>
            </motion.div>
          )}
        </div>

        <EditMenu
          selectedMenu={selectedMenu}
          editOpen={editOpen}
          setEditOpen={setEditOpen}
        />
      </div>
    </motion.div>
  );
};

export default AddMenu;
