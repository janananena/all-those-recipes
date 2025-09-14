import type {StylesConfig, ThemeConfig } from "react-select";

export type SelectOptionType = { label: string, value: string };

export const customTheme = (): ThemeConfig => (theme) => {
    const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
    return ({
        ...theme,
        colors: {
            ...theme.colors,
            neutral0: isDark ? "#212529" : theme.colors.neutral0,
            neutral80: isDark ? "#f8f9fa" : theme.colors.neutral80,
            primary25: isDark ? "#343a40" : theme.colors.primary25,
            primary: "#0d6efd",
        },
    });
}

export const customStyles = (isMulti: boolean) => {
    const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
    const baseStyles: StylesConfig<SelectOptionType, boolean> = {
        control: (base, state) => ({
            ...base,
            backgroundColor: isDark ? "#212529" : base.backgroundColor,
            borderColor: isDark ? "#495057" : base.borderColor,
            boxShadow: state.isFocused
                ? isDark ? "0 0 0 0.2rem rgba(13,110,253,.25)" : base.boxShadow
                : "none",
            "&:hover": {
                borderColor: isDark ? "#adb5bd" : base.borderColor,
            },
        }),
        singleValue: (base) => ({
            ...base,
            color: isDark ? "#f8f9fa" : base.color,
        }),
        placeholder: (base) => ({
            ...base,
            color: isDark ? "#adb5bd" : base.color,
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: isDark ? "#212529" : base.backgroundColor,
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused
                ? isDark ? "#343a40" : base.backgroundColor
                : base.backgroundColor,
            color: isDark ? "#f8f9fa" : base.color,
        }),
        dropdownIndicator: (base) => ({
            ...base,
            color: isDark ? "#f8f9fa" : base.color,
            "&:hover": {
                color: isDark ? "#ffffff" : "#212529",
            },
        }),
        clearIndicator: (base) => ({
            ...base,
            color: isDark ? "#f8f9fa" : base.color,
            "&:hover": {
                color: isDark ? "#ffffff" : "#212529",
            },
        }),
    };

    if (isMulti) {
        baseStyles.multiValue = (base) => ({
            ...base,
            backgroundColor: isDark ? "#495057" : base.backgroundColor,
        });
        baseStyles.multiValueLabel = (base) => ({
            ...base,
            color: isDark ? "#f8f9fa" : base.color,
        });
        baseStyles.multiValueRemove = (base) => ({
            ...base,
            color: isDark ? "#f8f9fa" : base.color,
            ":hover": {
                backgroundColor: isDark ? "#6c757d" : "#e9ecef",
                color: isDark ? "#ffffff" : "#212529",
            },
        });
    }
    return baseStyles;
};