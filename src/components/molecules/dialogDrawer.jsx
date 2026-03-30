import useMediaQuery from "@/hooks/useMediaQuery";
import { getType } from "@/lib";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/ui/drawer";

const DEFAULT_RESTRICTION = {
	min: true,
	max: true,
};

const DEFAULT_CLASS_NAMES = {
	dialog: "sm:rounded-2xl",
	drawer: "",
};

const DialogDrawer = ({
	children,
	containerClassNames = DEFAULT_CLASS_NAMES,
	classNames = DEFAULT_CLASS_NAMES,
	isOpen,
	onClose,
	close,
	trigger,
	title,
	description,
	restrict = DEFAULT_RESTRICTION,
	dismissible = true,
	containerChildren: ContainerChildren = null,
}) => {
	const isMD = useMediaQuery("(min-width: 768px)");
	const restrictions = {
		min:
			getType(restrict.min) === "Boolean"
				? restrict.min
					? "min-h-[50%]"
					: ""
				: restrict.min,
		max:
			getType(restrict.max) === "Boolean"
				? restrict.max
					? "max-h-full"
					: ""
				: restrict.max,
	};

	const containerClassName =
		getType(containerClassNames) === "String"
			? {
					dialog: [
						DEFAULT_CLASS_NAMES.dialog,
						containerClassNames,
					].join(" "),
					drawer: [
						DEFAULT_CLASS_NAMES.drawer,
						containerClassNames,
					].join(" "),
			  }
			: {
					...DEFAULT_CLASS_NAMES,
					...containerClassNames,
			  };

	const className =
		getType(containerClassNames) === "String"
			? {
					dialog: [DEFAULT_CLASS_NAMES.dialog, classNames].join(" "),
					drawer: [DEFAULT_CLASS_NAMES.drawer, classNames].join(" "),
			  }
			: {
					...DEFAULT_CLASS_NAMES,
					...classNames,
			  };

	const onOpenChange = (open) => {
		close?.(open);
		if (!open) onClose?.(open);
	};

	return isMD ? (
		<Dialog
			{...(trigger ? {} : { open: isOpen })}
			onOpenChange={onOpenChange}
		>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent
				className={cn(
					"flex max-w-lg flex-col gap-4",
					restrictions.min,
					restrictions.max,
					containerClassName.dialog
				)}
				dismissible={dismissible}
				onInteractOutside={(e) => {
					if (!dismissible) e.preventDefault();
				}}
				onEscapeKeyDown={(e) => {
					if (!dismissible) e.preventDefault();
				}}
			>
				{title || description ? (
					<DialogHeader>
						{title ? <DialogTitle>{title}</DialogTitle> : null}
						{description ? (
							<DialogDescription>{description}</DialogDescription>
						) : null}
					</DialogHeader>
				) : (
					<DialogHeader className="sr-only">
						<DialogTitle></DialogTitle>
						<DialogDescription></DialogDescription>
					</DialogHeader>
				)}
				<div
					className={cn(
						"relative flex flex-1 flex-col gap-4 overflow-hidden",
						className.dialog
					)}
				>
					{children}
				</div>
				{ContainerChildren && <ContainerChildren />}
			</DialogContent>
		</Dialog>
	) : (
		<Drawer
			{...(trigger ? {} : { open: isOpen })}
			onOpenChange={onOpenChange}
			dismissible={dismissible}
		>
			{trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
			<DrawerContent
				className={cn(
					"flex flex-col gap-4 overflow-hidden py-4",
					restrictions.min,
					restrictions.max,
					containerClassName.drawer
				)}
				dismissible={dismissible}
			>
				{title || description ? (
					<DrawerHeader className="flex flex-col items-start gap-1 px-4 text-left">
						{title ? <DrawerTitle>{title}</DrawerTitle> : null}
						{description ? (
							<DrawerDescription>{description}</DrawerDescription>
						) : null}
					</DrawerHeader>
				) : (
					<DrawerHeader className="sr-only">
						<DrawerTitle></DrawerTitle>
						<DrawerDescription></DrawerDescription>
					</DrawerHeader>
				)}
				<div
					className={cn(
						"relative flex flex-1 flex-col gap-4 overflow-hidden px-4",
						className.drawer
					)}
				>
					{children}
				</div>
				{ContainerChildren && <ContainerChildren />}
			</DrawerContent>
		</Drawer>
	);
};

export default DialogDrawer;
