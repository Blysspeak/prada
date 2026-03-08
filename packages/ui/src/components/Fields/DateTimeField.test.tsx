import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { DateTimeField } from './DateTimeField'

function TestDateTimeField(props: Omit<React.ComponentProps<typeof DateTimeField>, 'register'>) {
  const { register } = useForm()
  return <DateTimeField {...props} register={register} />
}

describe('DateTimeField', () => {
  it('renders datetime-local input', () => {
    render(<TestDateTimeField name="createdAt" label="Created At" />)
    const input = document.getElementById('createdAt')!
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'datetime-local')
  })

  it('renders label', () => {
    render(<TestDateTimeField name="createdAt" label="Created At" />)
    expect(screen.getByLabelText('Created At')).toBeInTheDocument()
  })

  it('shows required asterisk', () => {
    render(<TestDateTimeField name="createdAt" label="Created At" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not show required asterisk when not required', () => {
    render(<TestDateTimeField name="createdAt" label="Created At" />)
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<TestDateTimeField name="createdAt" label="Created At" error="Date is required" />)
    expect(screen.getByText('Date is required')).toBeInTheDocument()
  })
})
