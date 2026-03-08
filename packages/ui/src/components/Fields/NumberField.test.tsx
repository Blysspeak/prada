import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { NumberField } from './NumberField'

function TestNumberField(props: Omit<React.ComponentProps<typeof NumberField>, 'register'>) {
  const { register } = useForm()
  return <NumberField {...props} register={register} />
}

describe('NumberField', () => {
  it('renders number input', () => {
    render(<TestNumberField name="age" label="Age" />)
    const input = document.getElementById('age')!
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('renders label', () => {
    render(<TestNumberField name="age" label="Age" />)
    expect(screen.getByLabelText('Age')).toBeInTheDocument()
  })

  it('shows required asterisk', () => {
    render(<TestNumberField name="age" label="Age" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not show required asterisk when not required', () => {
    render(<TestNumberField name="age" label="Age" />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<TestNumberField name="age" label="Age" error="Age is required" />)
    expect(screen.getByText('Age is required')).toBeInTheDocument()
  })
})
