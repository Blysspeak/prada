import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { TextField } from './TextField'

function TestTextField(props: Omit<React.ComponentProps<typeof TextField>, 'register'> & { defaultValues?: Record<string, unknown> }) {
  const { defaultValues, ...rest } = props
  const { register } = useForm({ defaultValues })
  return <TextField {...rest} register={register} />
}

describe('TextField', () => {
  it('renders label and input', () => {
    render(<TestTextField name="email" label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows required asterisk when required', () => {
    render(<TestTextField name="email" label="Email" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not show required asterisk when not required', () => {
    render(<TestTextField name="email" label="Email" />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('shows error message when error prop set', () => {
    render(<TestTextField name="email" label="Email" error="Email is required" />)
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('renders placeholder', () => {
    render(<TestTextField name="email" label="Email" placeholder="you@example.com" />)
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  it('renders default placeholder when none provided', () => {
    render(<TestTextField name="email" label="Email" />)
    expect(screen.getByPlaceholderText('Enter Email')).toBeInTheDocument()
  })
})
