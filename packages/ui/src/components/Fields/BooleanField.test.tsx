import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { BooleanField } from './BooleanField'

function TestBooleanField(props: Omit<React.ComponentProps<typeof BooleanField>, 'register'>) {
  const { register } = useForm()
  return <BooleanField {...props} register={register} />
}

describe('BooleanField', () => {
  it('renders checkbox with label', () => {
    render(<TestBooleanField name="isActive" label="Active" />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders as checkbox input type', () => {
    render(<TestBooleanField name="isActive" label="Active" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('type', 'checkbox')
  })
})
