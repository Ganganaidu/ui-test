import { z } from 'zod';
import { type FeatureName } from '@usb-ui-test/common';
export declare const PLANNER_SCHEMA: z.ZodObject<{
    thought: z.ZodOptional<z.ZodObject<{
        plan: z.ZodOptional<z.ZodString>;
        think: z.ZodOptional<z.ZodString>;
        act: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
    action: z.ZodObject<{
        action_type: z.ZodEnum<{
            tap: "tap";
            long_press: "long_press";
            input_text: "input_text";
            swipe: "swipe";
            navigate_back: "navigate_back";
            navigate_home: "navigate_home";
            rotate: "rotate";
            hide_keyboard: "hide_keyboard";
            keyboard_enter: "keyboard_enter";
            wait: "wait";
            deep_link: "deep_link";
            set_location: "set_location";
            launch_app: "launch_app";
            status: "status";
        }>;
    }, z.core.$loose>;
    remember: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare function schemaForFeature(feature: FeatureName): z.ZodType<any>;
//# sourceMappingURL=schemas.d.ts.map