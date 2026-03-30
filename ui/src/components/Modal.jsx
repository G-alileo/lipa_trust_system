import React, { useEffect } from "react";
import { Button } from "./base";

export function Modal({ isOpen, onClose, title, children, width = "500px", showCloseButton = true }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem"
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)"
                }}
                onClick={onClose}
            />
            <div
                style={{
                    position: "relative",
                    background: "white",
                    borderRadius: "1.5rem",
                    boxShadow: "var(--shadow-lg)",
                    width: "100%",
                    maxWidth: width,
                    maxHeight: "90vh",
                    overflow: "auto"
                }}
            >
                {(title || showCloseButton) && (
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1.5rem 2rem",
                        borderBottom: "1px solid var(--ink-200)"
                    }}>
                        {title && <h3 style={{ margin: 0 }}>{title}</h3>}
                        {showCloseButton && (
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                style={{
                                    padding: "0.5rem",
                                    minWidth: "auto",
                                    border: "none",
                                    fontSize: "1.25rem",
                                    lineHeight: 1
                                }}
                            >
                                x
                            </Button>
                        )}
                    </div>
                )}
                <div style={{ padding: "2rem" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
