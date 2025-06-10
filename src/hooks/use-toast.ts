export const useToast = () => {
    return {
        toast: {
            success: (message: string) => {
                console.log(message)
            },
            error: (message: string) => {
                console.log(message)
            }
        }
    }
}