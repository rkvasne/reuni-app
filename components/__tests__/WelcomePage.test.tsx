import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import WelcomePage from '../WelcomePage'

// Mock dos hooks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

jest.mock('@/hooks/useAuth', () => ({
    useAuth: jest.fn(),
}))

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('WelcomePage', () => {
    beforeEach(() => {
        mockUseRouter.mockReturnValue({
            push: mockPush,
        } as any)

        mockUseAuth.mockReturnValue({
            user: { email: 'teste@exemplo.com' },
            loading: false,
            isAuthenticated: true,
        } as any)

        jest.clearAllMocks()
    })

    it('deve renderizar a página de boas-vindas corretamente', () => {
        render(<WelcomePage />)

        expect(screen.getByText(/Bem-vindo ao Reuni, teste!/)).toBeInTheDocument()
        expect(screen.getByText(/Você agora faz parte de uma comunidade/)).toBeInTheDocument()
    })

    it('deve exibir os cards de funcionalidades', () => {
        render(<WelcomePage />)

        expect(screen.getByText('Descubra Eventos')).toBeInTheDocument()
        expect(screen.getByText('Conecte-se')).toBeInTheDocument()
        expect(screen.getByText('Organize')).toBeInTheDocument()
    })

    it('deve navegar para a página principal ao clicar em "Explorar Eventos"', () => {
        render(<WelcomePage />)

        const exploreButton = screen.getByText('Explorar Eventos')
        fireEvent.click(exploreButton)

        expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('deve extrair o nome do usuário do email corretamente', () => {
        render(<WelcomePage />)

        expect(screen.getByText(/Bem-vindo ao Reuni, teste!/)).toBeInTheDocument()
    })

    it('deve usar "usuário" como fallback quando não há email', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            loading: false,
            isAuthenticated: false,
        } as any)

        render(<WelcomePage />)

        expect(screen.getByText(/Bem-vindo ao Reuni, usuário!/)).toBeInTheDocument()
    })
})