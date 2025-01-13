import { IconType } from 'react-icons';
import {
	ChevronUpIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	ChevronLeftIcon,
	ArrowUpRightIcon,
	ArrowPathIcon,
	CheckIcon,
	QuestionMarkCircleIcon,
	XMarkIcon,
	LinkIcon,
	ExclamationTriangleIcon,
	InformationCircleIcon,
	ExclamationCircleIcon,
	CheckCircleIcon,
	GlobeAsiaAustraliaIcon,
	EnvelopeIcon,
	CalendarDaysIcon,
	ClipboardIcon,
	BriefcaseIcon,
	PencilIcon,
	ComputerDesktopIcon,
	CodeBracketIcon
} from "@heroicons/react/24/outline";

import {
	PiHouseDuotone,
	PiUserCircleDuotone,
	PiGridFourDuotone,
	PiBookBookmarkDuotone,
	PiImageDuotone
} from "react-icons/pi";

import {
	FaDiscord,
	FaGithub,
	FaLinkedin,
	FaXTwitter,
	FaMapLocationDot,
	FaBullhorn,
	FaHandFist,
	FaGavel
} from "react-icons/fa6";

import {
	GiArchiveResearch
} from "react-icons/gi";

export const iconLibrary: Record<string, IconType> = {
	chevronUp: ChevronUpIcon,
	chevronDown: ChevronDownIcon,
	chevronRight: ChevronRightIcon,
	chevronLeft: ChevronLeftIcon,
	refresh: ArrowPathIcon,
	arrowUpRight: ArrowUpRightIcon,
	check: CheckIcon,
	helpCircle: QuestionMarkCircleIcon,
	infoCircle: InformationCircleIcon,
	warningTriangle: ExclamationTriangleIcon,
	errorCircle: ExclamationCircleIcon,
	checkCircle: CheckCircleIcon,
	email: EnvelopeIcon,
	globe: GlobeAsiaAustraliaIcon,
	person: PiUserCircleDuotone,
	grid: PiGridFourDuotone,
	book: PiBookBookmarkDuotone,
	close: XMarkIcon,
	openLink: LinkIcon,
	calendar: CalendarDaysIcon,
	home: PiHouseDuotone,
	gallery: PiImageDuotone,
	discord: FaDiscord,
	github: FaGithub,
	linkedin: FaLinkedin,
	x: FaXTwitter,
	clipboard: ClipboardIcon,
	briefcase: BriefcaseIcon,
	pen: PencilIcon,
	computer: ComputerDesktopIcon,
	code: CodeBracketIcon,
	location: FaMapLocationDot,
	bullhorn: FaBullhorn,
	fist: FaHandFist,
	research: GiArchiveResearch,
	gavel: FaGavel
};